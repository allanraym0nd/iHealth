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
    // Respond immediately to Safaricom
    res.status(200).json({ success: true });

    // Process the callback data
    const callbackData = req.body;
    console.log('Callback received:', callbackData);

    const { Body } = callbackData;

    // Validate the callback data
    if (!Body || !Body.stkCallback) {
      console.error('Invalid callback data:', callbackData);
      return;
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = Body.stkCallback;

    // Log the transaction details
    console.log('Transaction details:', {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    });

    // Find the transaction record
    const transaction = await MpesaTransaction.findOne({
      merchantRequestId: MerchantRequestID,
      checkoutRequestId: CheckoutRequestID,
    });

    if (!transaction) {
      console.error('Transaction not found:', { MerchantRequestID, CheckoutRequestID });
      return;
    }

    // Check if it's a successful transaction
    if (ResultCode === 0) {
      // Extract metadata for successful transactions
      const amount = CallbackMetadata.Item.find((item) => item.Name === 'Amount').Value;
      const mpesaReceiptNumber = CallbackMetadata.Item.find(
        (item) => item.Name === 'MpesaReceiptNumber'
      ).Value;
      const phoneNumber = CallbackMetadata.Item.find((item) => item.Name === 'PhoneNumber').Value;

      // Update transaction record
      transaction.status = 'completed';
      transaction.resultCode = ResultCode;
      transaction.resultDesc = ResultDesc;
      transaction.mpesaReceiptNumber = mpesaReceiptNumber;
      transaction.metadata = callbackData;
      await transaction.save();

      console.log('Transaction updated:', transaction);

      // Update billing record
      const billing = await Billing.findById(transaction.billingId);
      if (billing) {
        const invoice = billing.invoices.id(transaction.invoice);
        if (invoice) {
          invoice.status = 'Paid';
          invoice.paidDate = new Date();
          invoice.paymentMethod = 'M-Pesa';
          await billing.save();

          console.log('Billing record updated:', billing);
        }
      }
    } else {
      // Handle failed transactions
      transaction.status = 'failed';
      transaction.resultCode = ResultCode;
      transaction.resultDesc = ResultDesc;
      transaction.metadata = callbackData;
      await transaction.save();

      console.log('Transaction failed:', transaction);
    }
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
  }
};
// Add these methods to your mpesaController.js

// Check transaction status directly with Safaricom
exports.checkTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await MpesaTransaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Check with Safaricom
    const statusResult = await mpesaService.checkTransactionStatus(
      transaction.checkoutRequestId
    );
    
    // Update transaction based on status result
    if (statusResult.ResultCode === 0) {
      transaction.status = 'completed';
      transaction.resultCode = statusResult.ResultCode;
      transaction.resultDesc = statusResult.ResultDesc;
      await transaction.save();
      
      // Update invoice status if successful
      const billing = await Billing.findById(transaction.billingId);
      if (billing) {
        const invoice = billing.invoices.id(transaction.invoice);
        if (invoice && invoice.status !== 'Paid') {
          invoice.status = 'Paid';
          invoice.paidDate = new Date();
          invoice.paymentMethod = 'M-Pesa';
          await billing.save();
        }
      }
      
      return res.status(200).json({ 
        status: 'success', 
        message: 'Payment completed successfully', 
        transaction 
      });
    } else {
      transaction.status = 'failed';
      transaction.resultCode = statusResult.ResultCode;
      transaction.resultDesc = statusResult.ResultDesc;
      await transaction.save();
      
      return res.status(200).json({ 
        status: 'failed', 
        message: statusResult.ResultDesc, 
        transaction 
      });
    }
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return res.status(500).json({ message: 'Failed to check transaction status' });
  }
};

// Simulate payment completion for testing
exports.simulatePayment = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    
    const billing = await Billing.findOne({ 'invoices._id': invoiceId });
    if (!billing) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    const invoice = billing.invoices.id(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    invoice.status = 'Paid';
    invoice.paidDate = new Date();
    invoice.paymentMethod = 'M-Pesa';
    
    await billing.save();
    
    return res.status(200).json({ 
      message: 'Payment simulation completed successfully', 
      invoice 
    });
  } catch (error) {
    console.error('Payment simulation error:', error);
    return res.status(500).json({ message: 'Failed to simulate payment' });
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