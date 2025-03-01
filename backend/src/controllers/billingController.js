const Billing = require('../models/Billing');
const { AppError } = require('../middleware/errorHandler');

const billingController = {

  createProfile: async (req, res) => {
    try {
      // Check if user already has a profile
      const existingProfile = await Billing.findOne({ userId: req.user.id });
      if (existingProfile) {
        return res.status(400).json({ message: 'Billing profile already exists for this user' });
      }
      
      // Create new billing profile
      const billing = new Billing({
        userId: req.user.id,
        name: req.body.name,
        department: req.body.department,
        position: req.body.position,
        contact: {
          email: req.body.contact.email,
          phone: req.body.contact.phone
        }
      });
      
      await billing.save();
      res.status(201).json(billing);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Create invoice
  createInvoice: async (req, res, next) => {
    try {
      const billing = await Billing.findOne({ patient: req.params.patientId }) || 
        new Billing({ patient: req.params.patientId, invoices: [] });
  
      // Calculate total amount from items
      const calculatedTotalAmount = req.body.items.reduce((sum, item) => sum + item.amount, 0);
  
      const invoice = {
        items: req.body.items,
        totalAmount: calculatedTotalAmount,
        status: 'Pending',
        dueDate: new Date(Date.now() + 30*24*60*60*1000),
        createdAt: new Date()
      };
  
      const updatedBilling = await Billing.findOneAndUpdate(
        { patient: req.params.patientId },
        { $push: { invoices: invoice }},
        { new: true, upsert: true }
      );
  
      res.status(201).json({
        status: 'success',
        data: updatedBilling.invoices[updatedBilling.invoices.length - 1]
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all invoices

// Get all invoices
getInvoices: async (req, res, next) => {
  try {
    const billings = await Billing.find()
      .populate('patient', 'name');
    
    // Extract and format invoices
    const invoices = [];
    billings.forEach(billing => {
      if (billing.invoices && billing.invoices.length > 0) {
        billing.invoices.forEach(invoice => {
          invoices.push({
            _id: invoice._id,
            patientName: billing.patient ? billing.patient.name : 'Unknown',
            date: invoice.createdAt || new Date(),
            dueDate: invoice.dueDate,
            totalAmount: invoice.totalAmount,
            status: invoice.status,
            items: invoice.items,
            paymentMethod: invoice.paymentMethod
          });
        });
      }
    });
    
    res.status(200).json(invoices);
  } catch (error) {
    next(error);
  }
},

// Get payments
getPayments: async (req, res, next) => {
  try {
    const billings = await Billing.find()
      .populate('patient', 'name');
    
    // Extract paid invoices as payments
    const payments = [];
    billings.forEach(billing => {
      if (billing.invoices && billing.invoices.length > 0) {
        billing.invoices
          .filter(invoice => invoice.status === 'Paid' && invoice.paidDate)
          .forEach(invoice => {
            payments.push({
              _id: invoice._id,
              patientName: billing.patient ? billing.patient.name : 'Unknown',
              date: invoice.paidDate,
              amount: invoice.totalAmount,
              method: invoice.paymentMethod || 'Unknown',
              status: 'completed',
              invoiceId: invoice._id
            });
          });
      }
    });
    
    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
},

  // Process payment
  processPayment: async (req, res, next) => {
    try {
      const { invoiceId } = req.params;
      const { paymentMethod, amount } = req.body;
  
      // Find the billing record with this invoice
      const billing = await Billing.findOne({ 'invoices._id': invoiceId });
  
      if (!billing) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
  
      // Find the specific invoice
      const invoiceIndex = billing.invoices.findIndex(
        inv => inv._id.toString() === invoiceId
      );
  
      if (invoiceIndex === -1) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
  
      // Validate that payment amount matches invoice total
      if (amount !== billing.invoices[invoiceIndex].totalAmount) {
        return res.status(400).json({ 
          message: 'Payment amount must match the invoice total',
          expectedAmount: billing.invoices[invoiceIndex].totalAmount,
          providedAmount: amount
        });
      }
  
      // Update invoice status and payment details
      billing.invoices[invoiceIndex].status = 'Paid';
      billing.invoices[invoiceIndex].paymentMethod = paymentMethod;
      billing.invoices[invoiceIndex].paidDate = new Date();
  
      // Save the updated billing document
      await billing.save();
  
      res.status(200).json({
        message: 'Payment processed successfully',
        invoice: billing.invoices[invoiceIndex]
      });
    } catch (error) {
      console.error('Payment processing error:', error);
      res.status(500).json({ 
        message: 'Failed to process payment', 
        error: error.message 
      });
    }
  },
  
      
  getAllPatients: async (req, res, next) => {
    try {
      const Patient = require('../models/Patient'); // Import the Patient model
      const patients = await Patient.find().select('name _id');
      res.status(200).json({
        status: 'success',
        data: patients
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



  // Submit insurance claim
getInsuranceClaims: async (req, res, next) => {
  try {
    const billings = await Billing.find().populate('patient', 'name');
    
    // Flatten insurance claims from all billing records
    const insuranceClaims = billings.flatMap(billing => 
      billing.insuranceClaims.map(claim => ({
        ...claim.toObject(),
        patientName: billing.patient ? billing.patient.name : 'Unknown Patient',
        patientId: billing.patient ? billing.patient._id : null
      }))
    );
    
    res.status(200).json(insuranceClaims);
  } catch (error) {
    next(error);
  }
},

// Get insurance claims for a specific patient
getPatientInsuranceClaims: async (req, res, next) => {
  try {
    const { patientId } = req.params;
    
    const billing = await Billing.findOne({ patient: patientId });
    
    if (!billing) {
      return res.status(404).json({ message: 'No billing records found for this patient' });
    }
    
    const insuranceClaims = billing.insuranceClaims.map(claim => ({
      ...claim.toObject(),
      patientName: billing.patient ? billing.patient.name : 'Unknown Patient'
    }));
    
    res.status(200).json(insuranceClaims);
  } catch (error) {
    next(error);
  }
},

// Submit insurance claim
submitInsuranceClaim: async (req, res, next) => {
  try {
    console.log('Backend received claim data:', req.body);
    
    const { patientId, provider, claimNumber, amount, notes } = req.body;

    // Validate required fields
    if (!patientId) {
      return res.status(400).json({ 
        message: 'Patient ID is required' 
      });
    }

    // Find the billing record for the patient
    let billing = await Billing.findOne({ patient: patientId });

    // If no billing record exists, create one
    if (!billing) {
      billing = new Billing({ patient: patientId });
    }

    // Add new insurance claim
    const newClaim = {
      provider,
      claimNumber,
      amount,
      notes,
      status: 'Submitted',
      submissionDate: new Date()
    };

    billing.insuranceClaims.push(newClaim);
    await billing.save();

    res.status(201).json({
      status: 'success',
      data: newClaim
    });
  } catch (error) {
    console.error('Full error in claim submission:', error);
    next(error);
  }
},
  // Get financial reports
  getFinancialReports: async (req, res, next) => {
    try {
      const billings = await Billing.find();
  
      // Calculate total income (from paid invoices)
      const paidInvoices = billings.flatMap(b => 
        b.invoices.filter(inv => inv.status === 'Paid')
      );
      const totalIncome = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  
      // Calculate expenses
      const totalExpenses = billings.flatMap(b => b.expenses)
        .reduce((sum, expense) => sum + expense.amount, 0);
  
      // Calculate payment methods breakdown
      const paymentMethodBreakdown = paidInvoices.reduce((methods, invoice) => {
        if (invoice.paymentMethod) {
          if (!methods[invoice.paymentMethod]) {
            methods[invoice.paymentMethod] = {
              total: 0,
              count: 0
            };
          }
          methods[invoice.paymentMethod].total += invoice.totalAmount;
          methods[invoice.paymentMethod].count++;
        }
        return methods;
      }, {});
  
      // Convert payment method breakdown to formatted array
      const totalPayments = Object.values(paymentMethodBreakdown)
        .reduce((sum, method) => sum + method.total, 0);
  
      const paymentMethods = Object.entries(paymentMethodBreakdown).map(([name, data]) => ({
        name,
        total: data.total,
        percentage: totalPayments > 0 
          ? Number(((data.total / totalPayments) * 100).toFixed(2)) 
          : 0
      }));
  
      // Invoice status breakdown
      const invoiceStats = billings.reduce((stats, billing) => {
        billing.invoices.forEach(inv => {
          switch(inv.status) {
            case 'Pending': stats.pendingInvoices++; break;
            case 'Paid': stats.paidInvoices++; break;
            case 'Overdue': stats.overdueInvoices++; break;
          }
        });
        return stats;
      }, { pendingInvoices: 0, paidInvoices: 0, overdueInvoices: 0 });
  
      res.status(200).json({
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        profitMargin: totalIncome > 0 
          ? Number(((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2)) 
          : 0,
        ...invoiceStats,
        totalInvoices: invoiceStats.pendingInvoices + invoiceStats.paidInvoices + invoiceStats.overdueInvoices,
        paymentMethods
      });
    } catch (error) {
      next(error);
    }
  },

  // Add these methods to billingController.js
getExpenses: async (req, res, next) => {
  try {
    const billings = await Billing.find();
    
    // Flatten expenses from all billing records
    const expenses = billings.flatMap(billing => 
      billing.expenses.map(expense => ({
        ...expense.toObject(),
        _id: expense._id
      }))
    );
    
    res.status(200).json(expenses);
  } catch (error) {
    next(error);
  }
},

trackExpenses: async (req, res, next) => {
  try {
    const { category, amount, date, description } = req.body;
    
    // Find any billing record to attach the expense
    let billing = await Billing.findOne();
    
    // If no billing records exist, return an error
    if (!billing) {
      return res.status(404).json({ 
        message: 'No billing profile found to attach expense' 
      });
    }
    
    // Add new expense
    const newExpense = {
      category,
      amount,
      date: date || new Date(),
      description
    };
    
    billing.expenses.push(newExpense);
    await billing.save();
    
    // Return the newly created expense
    res.status(201).json({
      status: 'success',
      data: newExpense
    });
  } catch (error) {
    next(error);
  }
}


};

module.exports = billingController;