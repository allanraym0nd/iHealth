const Billing = require('../models/Billing');
const { AppError } = require('../middleware/errorHandler');

const billingController = {
  // Create invoice
  createInvoice: async (req, res, next) => {
    try {
      const billing = await Billing.findOne({ patient: req.params.patientId });
      
      if (!billing) {
        // If no billing record exists for patient, create one
        const newBilling = new Billing({
          patient: req.params.patientId,
          invoices: []
        });
        await newBilling.save();
      }

      const invoice = {
        items: req.body.items,
        totalAmount: req.body.items.reduce((sum, item) => sum + item.amount, 0),
        status: 'Pending',
        dueDate: new Date(Date.now() + 30*24*60*60*1000), // 30 days from now
        createdAt: new Date()
      };

      // Validate total amount matches sum of items
      if (invoice.totalAmount !== req.body.totalAmount) {
        throw new AppError('Total amount does not match sum of items', 400);
      }

      const updatedBilling = await Billing.findOneAndUpdate(
        { patient: req.params.patientId },
        { $push: { invoices: invoice }},
        { new: true }
      );

      res.status(201).json({
        status: 'success',
        data: updatedBilling.invoices[updatedBilling.invoices.length - 1]
      });
    } catch (error) {
      next(error);
    }
  },

  // Process payment
  processPayment: async (req, res, next) => {
    try {
      const billing = await Billing.findOne({
        "invoices._id": req.params.invoiceId
      });

      if (!billing) {
        throw new AppError('Invoice not found', 404);
      }

      const invoice = billing.invoices.id(req.params.invoiceId);
      
      if (invoice.status === 'Paid') {
        throw new AppError('Invoice already paid', 400);
      }

      // Update invoice status
      const updatedBilling = await Billing.findOneAndUpdate(
        { "invoices._id": req.params.invoiceId },
        { 
          $set: { 
            "invoices.$.status": "Paid",
            "invoices.$.paidDate": new Date(),
            "invoices.$.paymentMethod": req.body.paymentMethod
          }
        },
        { new: true }
      );

      res.json({
        status: 'success',
        data: updatedBilling.invoices.id(req.params.invoiceId)
      });
    } catch (error) {
      next(error);
    }
  },

  // Get patient invoices
  getPatientInvoices: async (req, res, next) => {
    try {
      const billing = await Billing.findOne({ patient: req.params.patientId })
        .populate('patient');

      if (!billing) {
        throw new AppError('No billing records found for this patient', 404);
      }

      res.json({
        status: 'success',
        data: billing.invoices
      });
    } catch (error) {
      next(error);
    }
  },

  // Track expenses
  trackExpenses: async (req, res, next) => {
    try {
      const billing = await Billing.findOneAndUpdate(
        {},
        { $push: { expenses: {
          category: req.body.category,
          amount: req.body.amount,
          date: new Date(),
          description: req.body.description
        }}},
        { new: true }
      );

      res.json({
        status: 'success',
        data: billing.expenses[billing.expenses.length - 1]
      });
    } catch (error) {
      next(error);
    }
  },

  // Submit insurance claim
  submitInsuranceClaim: async (req, res, next) => {
    try {
      const billing = await Billing.findOne({ patient: req.params.patientId });
      
      if (!billing) {
        throw new AppError('No billing records found for this patient', 404);
      }

      billing.insuranceClaims.push({
        provider: req.body.provider,
        claimNumber: req.body.claimNumber,
        amount: req.body.amount,
        submissionDate: new Date(),
        status: 'Pending'
      });

      await billing.save();

      res.status(201).json({
        status: 'success',
        data: billing.insuranceClaims[billing.insuranceClaims.length - 1]
      });
    } catch (error) {
      next(error);
    }
  },

  // Get financial reports
  getFinancialReports: async (req, res, next) => {
    try {
      const billing = await Billing.findOne();
      
      const totalIncome = billing.invoices
        .filter(invoice => invoice.status === 'Paid')
        .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

      const totalExpenses = billing.expenses
        .reduce((sum, expense) => sum + expense.amount, 0);

      const pendingPayments = billing.invoices
        .filter(invoice => invoice.status === 'Pending')
        .reduce((sum, invoice) => sum + invoice.totalAmount, 0);

      res.json({
        status: 'success',
        data: {
          totalIncome,
          totalExpenses,
          netProfit: totalIncome - totalExpenses,
          pendingPayments
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = billingController;