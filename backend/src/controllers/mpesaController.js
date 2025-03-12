// controllers/mpesaController.js
const mpesaService = require('../services/mpesaService');
const MpesaTransaction = require('../models/MpesaTransaction');
const Billing = require('../models/Billing');

// Initiate STK Push
exports.initiatePayment = async (req, res) => {
  try {
    const { billingId, invoiceId } = req.params;
    const { phoneNumber, amount } = req.body;
    
    // Validate request
    if (!phoneNumber || !amount) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number and amount are required' 
      });
    }
    
    // Find billing and relevant invoice
    const billing = await Billing.findById(billingId);
    if (!billing) {
      return res.status(404).json({ 
        success: false,
        message: 'Billing record not found' 
      });
    }
    
    const invoice = billing.invoices.id(invoiceId);
    if (!invoice) {
      return res.status(404).json({ 
        success: false,
        message: 'Invoice not found' 
      });
    }
    
    // Check if invoice is pending
    if (invoice.status !== 'Pending') {
      return res.status(400).json({ 
        success: false,
        message: 'This invoice has already been paid or is overdue' 
      });
    }
    
    // Initiate STK Push
    const stkResponse = await mpesaService.initiateSTKPush(
      phoneNumber,
      amount,
      invoiceId
    );
    
    // Create transaction record
    const transaction = new MpesaTransaction({
      patient: billing.patient,
      billingId: billing._id,
      invoice: invoiceId,
      phoneNumber,
      amount,
      merchantRequestId: stkResponse.MerchantRequestID,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      status: 'pending'
    });
    
    await transaction.save();
    
    return res.status(200).json({
      success: true,
      message: 'STK push initiated successfully',
      data: {
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID
      }
    });
    
  } catch (error) {
    console.error('Error initiating M-Pesa payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error.message
    });
  }
};

// Callback handler for M-Pesa
exports.mpesaCallback = async (req, res) => {
  try {
    // Respond immediately to Safaricom (as required by their API)
    res.status(200).json({ success: true });
    
    // Process the callback in the background
    const callbackData = req.body;
    const { Body } = callbackData;
    
    // Check if it's a successful transaction
    if (Body.stkCallback.ResultCode === 0) {
      const callbackMetadata = Body.stkCallback.CallbackMetadata.Item;
      const amount = callbackMetadata.find(item => item.Name === 'Amount').Value;
      const mpesaReceiptNumber = callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber').Value;
      const phoneNumber = callbackMetadata.find(item => item.Name === 'PhoneNumber').Value;
      
      // Update transaction record
      const transaction = await MpesaTransaction.findOne({
        merchantRequestId: Body.stkCallback.MerchantRequestID,
        checkoutRequestId: Body.stkCallback.CheckoutRequestID
      });
      
      if (transaction) {
        transaction.status = 'completed';
        transaction.resultCode = Body.stkCallback.ResultCode;
        transaction.resultDesc = Body.stkCallback.ResultDesc;
        transaction.mpesaReceiptNumber = mpesaReceiptNumber;
        transaction.metadata = callbackData;
        await transaction.save();
        
        // Update billing record
        const billing = await Billing.findById(transaction.billingId);
        if (billing) {
          const invoice = billing.invoices.id(transaction.invoice);
          if (invoice) {
            invoice.status = 'Paid';
            invoice.paidDate = new Date();
            invoice.paymentMethod = 'M-Pesa'; // Add M-Pesa as a payment method
            await billing.save();
          }
        }
      }
    } else {
      // Failed transaction
      const transaction = await MpesaTransaction.findOne({
        merchantRequestId: Body.stkCallback.MerchantRequestID,
        checkoutRequestId: Body.stkCallback.CheckoutRequestID
      });
      
      if (transaction) {
        transaction.status = 'failed';
        transaction.resultCode = Body.stkCallback.ResultCode;
        transaction.resultDesc = Body.stkCallback.ResultDesc;
        transaction.metadata = callbackData;
        await transaction.save();
      }
    }
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    // Don't return error to Safaricom as they expect a success response
  }
};

// Check payment status
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { billingId, invoiceId } = req.params;
    
    // Find the most recent transaction for this invoice
    const transaction = await MpesaTransaction.findOne({ 
      billingId,
      invoice: invoiceId 
    }).sort({ createdAt: -1 });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'No payment transaction found for this invoice'
      });
    }
    
    // If transaction is already completed or failed, return status
    if (['completed', 'failed'].includes(transaction.status)) {
      return res.status(200).json({
        success: true,
        status: transaction.status,
        message: transaction.resultDesc || 
          (transaction.status === 'completed' ? 'Payment completed successfully' : 'Payment failed')
      });
    }
    
    // If transaction is pending and has checkoutRequestId, query status
    if (transaction.status === 'pending' && transaction.checkoutRequestId) {
      try {
        const statusResponse = await mpesaService.querySTKStatus(transaction.checkoutRequestId);
        
        // Update transaction based on status response
        if (statusResponse.ResultCode === 0) {
          transaction.status = 'completed';
          transaction.resultCode = statusResponse.ResultCode;
          transaction.resultDesc = statusResponse.ResultDesc;
          await transaction.save();
          
          // Update billing record
          const billing = await Billing.findById(transaction.billingId);
          if (billing) {
            const invoice = billing.invoices.id(transaction.invoice);
            if (invoice) {
              invoice.status = 'Paid';
              invoice.paidDate = new Date();
              invoice.paymentMethod = 'M-Pesa';
              await billing.save();
            }
          }
          
          return res.status(200).json({
            success: true,
            status: 'completed',
            message: 'Payment completed successfully'
          });
        } else {
          transaction.status = 'failed';
          transaction.resultCode = statusResponse.ResultCode;
          transaction.resultDesc = statusResponse.ResultDesc;
          await transaction.save();
          
          return res.status(200).json({
            success: true,
            status: 'failed',
            message: statusResponse.ResultDesc || 'Payment failed'
          });
        }
      } catch (error) {
        // If query fails, assume transaction is still pending
        return res.status(200).json({
          success: true,
          status: 'pending',
          message: 'Payment is still being processed'
        });
      }
    }
    
    // Default response for pending transactions
    return res.status(200).json({
      success: true,
      status: transaction.status,
      message: 'Payment is being processed'
    });
    
  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message
    });
  }
};