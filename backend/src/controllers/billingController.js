const Billing = require('../models/Billing');
const { AppError } = require('../middleware/errorHandler');
const mpesaService = require('../services/mpesaService');

const billingController = {
  // Create profile
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
  // Create invoice
createInvoice: async (req, res, next) => {
  try {
    const billing = await Billing.findOne({ patient: req.params.patientId }) || 
      new Billing({ patient: req.params.patientId, invoices: [] });

    // Calculate total amount from items
    const calculatedTotalAmount = req.body.items.reduce((sum, item) => sum + item.amount, 0);

    // Explicitly set createdAt to the current date and time
    const invoice = {
      items: req.body.items,
      totalAmount: calculatedTotalAmount,
      status: 'Pending',
      dueDate: new Date(Date.now() + 30*24*60*60*1000),
      createdAt: new Date() // Make sure this is set
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
            date: invoice.createdAt || new Date(), // Use createdAt field here
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
      const { paymentMethod, amount, phoneNumber } = req.body;
  
      console.log('Payment processing request:', { invoiceId, paymentMethod, amount, phoneNumber });
  
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
  
      // Verify invoice amount matches
      const invoiceAmount = billing.invoices[invoiceIndex].totalAmount;
      if (amount !== invoiceAmount) {
        return res.status(400).json({ 
          message: 'Payment amount must match the invoice total',
          expectedAmount: invoiceAmount,
          providedAmount: amount
        });
      }
  
      // Handle M-Pesa payment specifically
      if (paymentMethod === 'M-Pesa') {
        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number is required for M-Pesa payment' });
        }
        
        if (!/^2547\d{8}$/.test(phoneNumber)) {
            return res.status(400).json({ message: 'Invalid phone number format. Use 2547XXXXXXXX' });
        }
        
        console.log('Processing M-Pesa Payment with:', phoneNumber); // Log phone number
        
        try {
            const mpesaResponse = await mpesaService.initiateSTKPush(phoneNumber, invoiceAmount, invoiceId);
    
          // Update invoice status to pending M-Pesa payment
          billing.invoices[invoiceIndex].status = 'Pending';
          billing.invoices[invoiceIndex].paymentMethod = 'M-Pesa';
  
          await billing.save();
  
          return res.status(200).json({
            message: 'M-Pesa payment initiated',
            checkoutRequestId: mpesaResponse.CheckoutRequestID,
            status: 'pending'
          });
        } catch (mpesaError) {
          console.error('M-Pesa payment error:', mpesaError);
          return res.status(500).json({
            message: 'Failed to initiate M-Pesa payment',
            error: mpesaError.message
          });
        }
      }
  
      // Handle other payment methods
      billing.invoices[invoiceIndex].status = 'Paid';
      billing.invoices[invoiceIndex].paymentMethod = paymentMethod;
      billing.invoices[invoiceIndex].paidDate = new Date();
  
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

  // Check payment status
  checkPaymentStatus: async (req, res, next) => {
    try {
      const { invoiceId } = req.params;
      
      // Find the billing record with this invoice
      const billing = await Billing.findOne({ 'invoices._id': invoiceId });

      if (!billing) {
        return res.status(404).json({ 
          success: false,
          message: 'Invoice not found' 
        });
      }

      // Find the specific invoice
      const invoice = billing.invoices.find(
        inv => inv._id.toString() === invoiceId
      );

      if (!invoice) {
        return res.status(404).json({ 
          success: false,
          message: 'Invoice not found' 
        });
      }

      // Return the current payment status
      return res.status(200).json({
        success: true,
        status: invoice.status.toLowerCase(),
        message: `Payment is ${invoice.status.toLowerCase()}`
      });
      
    } catch (error) {
      console.error('Error checking payment status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check payment status',
        error: error.message
      });
    }
  },

  // Update payment status
  updatePaymentStatus: async (req, res, next) => {
    try {
      const { invoiceId } = req.params;
      const { status } = req.body;
      
      const billing = await Billing.findOne({ 'invoices._id': invoiceId });
      if (!billing) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      const invoiceIndex = billing.invoices.findIndex(
        inv => inv._id.toString() === invoiceId
      );
      
      if (invoiceIndex === -1) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      billing.invoices[invoiceIndex].status = status;
      if (status.toLowerCase() === 'paid') {
        billing.invoices[invoiceIndex].paidDate = new Date();
      }
      
      await billing.save();
      
      res.status(200).json({
        message: `Payment status updated to ${status}`,
        invoice: billing.invoices[invoiceIndex]
      });
    } catch (error) {
      next(error);
    }
  },
      
  // Get all patients
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

  // Get insurance claims
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

  // Get expenses
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

  // Track expenses
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
  },

  // Generate printable reports
  generateReport: async (req, res, next) => {
    try {
      const { reportType, startDate, endDate, format, filters } = req.body;
      
      // Parse dates
      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate) : new Date();
      
      // Fetch billing data - temporarily removing date filter to show all records
      const billings = await Billing.find().populate('patient', 'name');
      console.log(`Found ${billings.length} billing records in total (ignoring date filter)`);
      
      // Process data based on report type
      let reportData = {};
      
      switch (reportType) {
        case 'financialSummary':
          reportData = generateFinancialSummaryReport(billings, start, end);
          break;
        case 'invoiceDetails':
          reportData = generateInvoiceDetailsReport(billings, start, end, filters);
          break;
        case 'paymentAnalysis':
          reportData = generatePaymentAnalysisReport(billings, start, end);
          break;
        case 'insuranceClaims':
          reportData = generateInsuranceClaimsReport(billings, start, end);
          break;
        default:
          return res.status(400).json({ message: 'Invalid report type' });
      }
      
      // Add metadata to the report
      reportData.metadata = {
        reportType,
        generatedAt: new Date().toLocaleString()
      };
      
      // Return appropriate format
      if (format === 'json') {
        return res.json(reportData);
      } else if (format === 'pdf') {
        return generatePDFReport(reportData, res);
      } else if (format === 'csv') {
        return generateCSVReport(reportData, res);
      } else if (format === 'excel') {
        return generateExcelReport(reportData, res);
      }
      
      return res.status(400).json({ message: 'Invalid format specified' });
    } catch (error) {
      console.error('Report generation error:', error);
      next(error);
    }
  }
};

// Helper functions for report generation
function generateFinancialSummaryReport(billings, startDate, endDate) {
  // Calculate total income from paid invoices
  const paidInvoices = billings.flatMap(billing => 
    billing.invoices.filter(inv => 
      inv.status === 'Paid' && 
      inv.paidDate && 
      new Date(inv.paidDate) >= startDate && 
      new Date(inv.paidDate) <= endDate
    )
  );

  // Calculate total income
  const totalIncome = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  // Calculate expenses
  const expenses = billings.flatMap(billing => 
    billing.expenses.filter(exp => 
      new Date(exp.date) >= startDate && 
      new Date(exp.date) <= endDate
    )
  );

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate net profit and margin
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 
    ? ((netProfit / totalIncome) * 100).toFixed(2) 
    : 0;

  // Payment methods breakdown
  const paymentMethodsBreakdown = {};
  paidInvoices.forEach(inv => {
    if (inv.paymentMethod) {
      if (!paymentMethodsBreakdown[inv.paymentMethod]) {
        paymentMethodsBreakdown[inv.paymentMethod] = 0;
      }
      paymentMethodsBreakdown[inv.paymentMethod] += inv.totalAmount;
    }
  });

  // Expense categories breakdown
  const expenseCategoriesBreakdown = {};
  expenses.forEach(exp => {
    if (!expenseCategoriesBreakdown[exp.category]) {
      expenseCategoriesBreakdown[exp.category] = 0;
    }
    expenseCategoriesBreakdown[exp.category] += exp.amount;
  });

  // Invoice statistics
  // Modify the invoiceStats object in the generateFinancialSummaryReport function:
const invoiceStats = {
  // This should be the total of all types, not calculated separately
  total: paidInvoices.length + 
         billings.flatMap(billing => 
           billing.invoices.filter(inv => 
             inv.status === 'Pending'
           )
         ).length +
         billings.flatMap(billing => 
           billing.invoices.filter(inv => 
             inv.status === 'Overdue'
           )
         ).length,
  paid: paidInvoices.length,
  pending: billings.flatMap(billing => 
    billing.invoices.filter(inv => 
      inv.status === 'Pending'
    )
  ).length,
  overdue: billings.flatMap(billing => 
    billing.invoices.filter(inv => 
      inv.status === 'Overdue'
    )
  ).length
};
  return {
    title: 'Financial Summary Report',
    dateRange: `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
    summary: {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin
    },
    invoices: invoiceStats,
    paymentMethods: Object.entries(paymentMethodsBreakdown).map(([method, amount]) => ({
      method,
      amount,
      percentage: totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(2) : "0"
    })),
    expenses: Object.entries(expenseCategoriesBreakdown).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(2) : "0"
    }))
  };
}

// Invoice Details Report
// Invoice Details Report
function generateInvoiceDetailsReport(billings, startDate, endDate) {
  // Extract all invoices - with proper date handling
  const invoices = [];
  
  billings.forEach(billing => {
    if (billing.invoices && billing.invoices.length > 0) {
      billing.invoices.forEach(inv => {
        // Format dates properly - the date might be in createdAt or in a property called date
        // We need to check both since your frontend expects "date" but your schema uses "createdAt"
        const invoiceDate = inv.date || inv.createdAt || new Date();
        
        invoices.push({
          id: inv._id,
          patientName: billing.patient ? billing.patient.name : 'Unknown',
          patientId: billing.patient ? billing.patient._id : null,
          createdAt: invoiceDate,
          date: invoiceDate, // Add this for consistency with frontend
          dueDate: inv.dueDate,
          paidDate: inv.paidDate,
          status: inv.status,
          totalAmount: inv.totalAmount,
          paymentMethod: inv.paymentMethod,
          items: inv.items
        });
      });
    }
  });
  
  // Sort invoices by date (newest first)
  invoices.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB - dateA;
  });
  
  // Calculate summary statistics
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidAmount = invoices
    .filter(inv => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const pendingAmount = invoices
    .filter(inv => inv.status === 'Pending')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const overdueAmount = invoices
    .filter(inv => inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  
  return {
    title: 'Invoice Details Report',
    dateRange: `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
    summary: {
      totalInvoices: invoices.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      paidCount: invoices.filter(inv => inv.status === 'Paid').length,
      pendingCount: invoices.filter(inv => inv.status === 'Pending').length,
      overdueCount: invoices.filter(inv => inv.status === 'Overdue').length
    },
    invoices
  };
}

// Payment Analysis Report
function generatePaymentAnalysisReport(billings, startDate, endDate) {
  // Extract all paid invoices within the date range
  const payments = [];
  
  billings.forEach(billing => {
    if (billing.invoices && billing.invoices.length > 0) {
      billing.invoices
        .filter(inv => 
          inv.status === 'Paid' && 
          inv.paidDate && 
          new Date(inv.paidDate) >= startDate && 
          new Date(inv.paidDate) <= endDate
        )
        .forEach(inv => {
          payments.push({
            id: inv._id,
            patientName: billing.patient ? billing.patient.name : 'Unknown',
            patientId: billing.patient ? billing.patient._id : null,
            invoiceDate: inv.createdAt,
            paidDate: inv.paidDate,
            amount: inv.totalAmount,
            paymentMethod: inv.paymentMethod || 'Unknown'
          });
        });
    }
  });
  
  // Sort payments by paid date (newest first)
  payments.sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
  
  // Calculate payment method breakdown
  const paymentMethods = {};
  payments.forEach(payment => {
    if (!paymentMethods[payment.paymentMethod]) {
      paymentMethods[payment.paymentMethod] = {
        count: 0,
        amount: 0
      };
    }
    paymentMethods[payment.paymentMethod].count++;
    paymentMethods[payment.paymentMethod].amount += payment.amount;
  });
  
  // Format payment methods for display
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const methodsBreakdown = Object.entries(paymentMethods).map(([method, data]) => ({
    method,
    count: data.count,
    amount: data.amount,
    percentage: totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(2) : "0"
  }));
  
  // Group payments by day for trend analysis
  const paymentsByDay = {};
  payments.forEach(payment => {
    const day = new Date(payment.paidDate).toLocaleDateString();
    if (!paymentsByDay[day]) {
      paymentsByDay[day] = 0;
    }
    paymentsByDay[day] += payment.amount;
  });
  
  // Format daily trends for display
  const dailyTrends = Object.entries(paymentsByDay).map(([day, amount]) => ({
    day,
    amount
  })).sort((a, b) => new Date(a.day) - new Date(b.day));
  
  return {
    title: 'Payment Analysis Report',
    dateRange: `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
    summary: {
      totalPayments: payments.length,
      totalAmount,
      averagePayment: payments.length > 0 ? (totalAmount / payments.length).toFixed(2) : "0"
    },
    paymentMethods: methodsBreakdown,
    dailyTrends,
    payments
  };
}

// Insurance Claims Report
function generateInsuranceClaimsReport(billings, startDate, endDate) {
  // Extract all insurance claims within the date range
  const claims = [];
  
  billings.forEach(billing => {
    if (billing.insuranceClaims && billing.insuranceClaims.length > 0) {
      billing.insuranceClaims
        .filter(claim => 
          new Date(claim.submissionDate) >= startDate && 
          new Date(claim.submissionDate) <= endDate
        )
        .forEach(claim => {
          claims.push({
            id: claim._id,
            patientName: billing.patient ? billing.patient.name : 'Unknown',
            patientId: billing.patient ? billing.patient._id : null,
            provider: claim.provider,
            claimNumber: claim.claimNumber,
            submissionDate: claim.submissionDate,
            responseDate: claim.responseDate,
            amount: claim.amount,
            status: claim.status,
            notes: claim.notes
          });
        });
    }
  });
  
  // Sort claims by submission date (newest first)
  claims.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));
  
  // Calculate summary statistics
  const totalAmount = claims.reduce((sum, claim) => sum + claim.amount, 0);
  
  // Calculate status breakdown
  const statusCounts = {
    Submitted: 0,
    Processing: 0,
    Approved: 0,
    Rejected: 0,
    Paid: 0
  };
  
  // Continue from where we left off in generateInsuranceClaimsReport
  claims.forEach(claim => {
    if (statusCounts.hasOwnProperty(claim.status)) {
      statusCounts[claim.status]++;
    }
  });
  
  // Calculate provider breakdown
  const providers = {};
  claims.forEach(claim => {
    if (!providers[claim.provider]) {
      providers[claim.provider] = {
        count: 0,
        amount: 0
      };
    }
    providers[claim.provider].count++;
    providers[claim.provider].amount += claim.amount;
  });
  
  // Format providers for display
  const providersBreakdown = Object.entries(providers).map(([provider, data]) => ({
    provider,
    count: data.count,
    amount: data.amount,
    percentage: totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(2) : "0"
  }));
  
  return {
    title: 'Insurance Claims Report',
    dateRange: `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
    summary: {
      totalClaims: claims.length,
      totalAmount,
      submittedCount: statusCounts.Submitted,
      processingCount: statusCounts.Processing,
      approvedCount: statusCounts.Approved,
      rejectedCount: statusCounts.Rejected,
      paidCount: statusCounts.Paid
    },
    providerBreakdown: providersBreakdown,
    claims
  };
}

// Generate PDF report
async function generatePDFReport(reportData, res) {
  // We'll use pdfkit for PDF generation
  const PDFDocument = require('pdfkit');
  
  // Create a document
  const doc = new PDFDocument({ margin: 50 });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition', 
    `attachment; filename=${reportData.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`
  );
  
  // Pipe the PDF to the response
  doc.pipe(res);
  
  // Add hospital header
  doc.fontSize(20).text('MindSpeak Healthcare', { align: 'center' });
  doc.fontSize(14).text('Billing Department', { align: 'center' });
  doc.moveDown();
  
  // Add report title and date range
  doc.fontSize(16).text(reportData.title, { align: 'center' });
  doc.fontSize(10).text(`Period: ${reportData.dateRange}`, { align: 'center' });
  doc.fontSize(8).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(2);
  
  // Add content based on report type
  switch (reportData.title) {
    case 'Financial Summary Report':
      addFinancialSummaryToPDF(doc, reportData);
      break;
    case 'Invoice Details Report':
      addInvoiceDetailsToPDF(doc, reportData);
      break;
    case 'Payment Analysis Report':
      addPaymentAnalysisToPDF(doc, reportData);
      break;
    case 'Insurance Claims Report':
      addInsuranceClaimsToPDF(doc, reportData);
      break;
    default:
      // Generic content for testing
      doc.fontSize(12).text('Report Summary:', { underline: true });
      doc.moveDown();
      
      if (reportData.summary) {
        Object.entries(reportData.summary).forEach(([key, value]) => {
          doc.fontSize(10).text(`${key}: ${value}`);
        });
      } else {
        doc.text('No summary data available.');
      }
  }
  
  // Add page numbers
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc.fontSize(8);
    doc.text(
      `Page ${i + 1} of ${pageCount}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    );
  }
  
  // Finalize the PDF
  doc.end();
}

// Helper function to add financial summary to PDF
function addFinancialSummaryToPDF(doc, reportData) {
  // Financial Summary section
  doc.fontSize(14).text('Financial Summary', { underline: true });
  doc.moveDown(0.5);
  
  // Check if we have any meaningful financial data
  const hasData = 
    reportData && 
    reportData.summary && 
    (reportData.summary.totalIncome > 0 || 
     reportData.summary.totalExpenses > 0 || 
     (reportData.invoices && reportData.invoices.total > 0));
  
  if (!hasData) {
    // Show a message when no data is available
    doc.fontSize(10).text('No financial data available for the selected period.', { italic: true });
    doc.moveDown();
    return; // Exit the function early
  }
  
  // If we have data, continue with the normal rendering
  doc.fontSize(10);
  doc.text(`Total Revenue: $${reportData.summary.totalIncome.toFixed(2)}`);
  doc.text(`Total Expenses: $${reportData.summary.totalExpenses.toFixed(2)}`);
  doc.text(`Net Profit: $${reportData.summary.netProfit.toFixed(2)}`);
  doc.text(`Profit Margin: ${reportData.summary.profitMargin}%`);
  doc.moveDown();
  
  // Invoice statistics
  doc.fontSize(14).text('Invoice Statistics', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(10);
  doc.text(`Total Invoices: ${reportData.invoices.total || 0}`);
  doc.text(`Paid Invoices: ${reportData.invoices.paid || 0}`);
  doc.text(`Pending Invoices: ${reportData.invoices.pending || 0}`);
  doc.text(`Overdue Invoices: ${reportData.invoices.overdue || 0}`);
  doc.moveDown();
  
  // Payment Methods
  if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
    doc.fontSize(14).text('Payment Methods', { underline: true });
    doc.moveDown(0.5);
    
    // Simple table for payment methods
    const methodsTable = {
      headers: ['Method', 'Amount', 'Percentage'],
      rows: reportData.paymentMethods.map(({ method, amount, percentage }) => [
        method,
        `$${amount.toFixed(2)}`,
        `${percentage}%`
      ])
    };
    
    drawTable(doc, methodsTable);
    doc.moveDown();
  }
  
  // Expense Categories
  if (reportData.expenses && reportData.expenses.length > 0) {
    doc.fontSize(14).text('Expense Categories', { underline: true });
    doc.moveDown(0.5);
    
    // Simple table for expense categories
    const expensesTable = {
      headers: ['Category', 'Amount', 'Percentage'],
      rows: reportData.expenses.map(({ category, amount, percentage }) => [
        category,
        `$${amount.toFixed(2)}`,
        `${percentage}%`
      ])
    };
    
    drawTable(doc, expensesTable);
  }
}

// Add invoice details content to PDF
// Add invoice details content to PDF
function addInvoiceDetailsToPDF(doc, reportData) {
  // Summary section
  doc.fontSize(14).text('Invoice Summary', { underline: true });
  doc.moveDown(0.5);
  
  doc.fontSize(10);
  doc.text(`Total Invoices: ${reportData.summary.totalInvoices || 0}`);
  doc.text(`Total Amount: $${reportData.summary.totalAmount.toFixed(2)}`);
  doc.text(`Paid Invoices: ${reportData.summary.paidCount || 0} ($${(reportData.summary.paidAmount || 0).toFixed(2)})`);
  doc.text(`Pending Invoices: ${reportData.summary.pendingCount || 0} ($${(reportData.summary.pendingAmount || 0).toFixed(2)})`);
  doc.text(`Overdue Invoices: ${reportData.summary.overdueCount || 0} ($${(reportData.summary.overdueAmount || 0).toFixed(2)})`);
  doc.moveDown();
  
  // Invoices table
  if (reportData.invoices && reportData.invoices.length > 0) {
    doc.fontSize(14).text('Invoice List', { underline: true });
    doc.moveDown(0.5);
    
    // Table for invoices
    const invoicesTable = {
      headers: ['Patient', 'Date', 'Due Date', 'Amount', 'Status'],
      rows: reportData.invoices.map(inv => [
        inv.patientName,
        // Use the most reliable date property
        (inv.date instanceof Date) 
          ? inv.date.toLocaleDateString() 
          : (inv.date 
              ? new Date(inv.date).toLocaleDateString() 
              : 'Invalid Date'),
        (inv.dueDate instanceof Date)
          ? inv.dueDate.toLocaleDateString()
          : (inv.dueDate
              ? new Date(inv.dueDate).toLocaleDateString()
              : 'Invalid Date'),
        `$${inv.totalAmount.toFixed(2)}`,
        inv.status
      ])
    };
    
    drawTable(doc, invoicesTable);
  } else {
    doc.fontSize(10).text('No invoices available for the selected period.', { italic: true });
  }
}

// Add payment analysis content to PDF
function addPaymentAnalysisToPDF(doc, reportData) {
  // Summary section
  doc.fontSize(14).text('Payment Summary', { underline: true });
  doc.moveDown(0.5);
  
  if (!reportData.summary || reportData.summary.totalPayments === 0) {
    doc.fontSize(10).text('No payment data available for the selected period.', { italic: true });
    doc.moveDown();
    return;
  }
  
  doc.fontSize(10);
  doc.text(`Total Payments: ${reportData.summary.totalPayments}`);
  doc.text(`Total Amount: $${reportData.summary.totalAmount.toFixed(2)}`);
  doc.text(`Average Payment: $${reportData.summary.averagePayment}`);
  doc.moveDown();
  
  // Payment methods breakdown
  if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
    doc.fontSize(14).text('Payment Methods', { underline: true });
    doc.moveDown(0.5);
    
    // Table for payment methods
    const methodsTable = {
      headers: ['Method', 'Count', 'Amount', 'Percentage'],
      rows: reportData.paymentMethods.map(method => [
        method.method,
        method.count.toString(),
        `$${method.amount.toFixed(2)}`,
        `${method.percentage}%`
      ])
    };
    
    drawTable(doc, methodsTable);
    doc.moveDown();
  }
  
  // Payments table
  if (reportData.payments && reportData.payments.length > 0) {
    doc.fontSize(14).text('Payment Details', { underline: true });
    doc.moveDown(0.5);
    
    // Table for payments
    const paymentsTable = {
      headers: ['Patient', 'Date', 'Amount', 'Method'],
      rows: reportData.payments.map(payment => [
        payment.patientName,
        new Date(payment.paidDate).toLocaleDateString(),
        `$${payment.amount.toFixed(2)}`,
        payment.paymentMethod
      ])
    };
    
    drawTable(doc, paymentsTable);
  }
}

// Add insurance claims content to PDF
function addInsuranceClaimsToPDF(doc, reportData) {
  // Summary section
  doc.fontSize(14).text('Claims Summary', { underline: true });
  doc.moveDown(0.5);
  
  if (!reportData.summary || reportData.summary.totalClaims === 0) {
    doc.fontSize(10).text('No insurance claims available for the selected period.', { italic: true });
    doc.moveDown();
    return;
  }
  
  doc.fontSize(10);
  doc.text(`Total Claims: ${reportData.summary.totalClaims}`);
  doc.text(`Total Amount: $${reportData.summary.totalAmount.toFixed(2)}`);
  doc.text(`Submitted: ${reportData.summary.submittedCount}`);
  doc.text(`Processing: ${reportData.summary.processingCount}`);
  doc.text(`Approved: ${reportData.summary.approvedCount}`);
  doc.text(`Rejected: ${reportData.summary.rejectedCount}`);
  doc.text(`Paid: ${reportData.summary.paidCount}`);
  doc.moveDown();
  
  // Provider breakdown
  if (reportData.providerBreakdown && reportData.providerBreakdown.length > 0) {
    doc.fontSize(14).text('Insurance Providers', { underline: true });
    doc.moveDown(0.5);
    
    // Table for providers
    const providersTable = {
      headers: ['Provider', 'Claims', 'Amount', 'Percentage'],
      rows: reportData.providerBreakdown.map(provider => [
        provider.provider,
        provider.count.toString(),
        `$${provider.amount.toFixed(2)}`,
        `${provider.percentage}%`
      ])
    };
    
    drawTable(doc, providersTable);
    doc.moveDown();
  }
  
  // Claims table
  if (reportData.claims && reportData.claims.length > 0) {
    doc.fontSize(14).text('Claim Details', { underline: true });
    doc.moveDown(0.5);
    
    // Table for claims
    const claimsTable = {
      headers: ['Patient', 'Provider', 'Claim #', 'Date', 'Amount', 'Status'],
      rows: reportData.claims.map(claim => [
        claim.patientName,
        claim.provider,
        claim.claimNumber,
        new Date(claim.submissionDate).toLocaleDateString(),
        `$${claim.amount.toFixed(2)}`,
        claim.status
      ])
    };
    
    drawTable(doc, claimsTable);
  }
}

// Helper function to draw tables in PDF
function drawTable(doc, table) {
  const { headers, rows } = table;
  
  if (!headers || !rows || rows.length === 0) {
    doc.text('No data available for table');
    return;
  }
  
  const columnCount = headers.length;
  const tableWidth = doc.page.width - 100;
  const columnWidth = tableWidth / columnCount;
  const rowHeight = 20;
  let y = doc.y;
  
  // Draw headers
  doc.font('Helvetica-Bold');
  headers.forEach((header, i) => {
    doc.text(header, 50 + (i * columnWidth), y, {
      width: columnWidth,
      align: 'left'
    });
  });
  
  y += rowHeight;
  doc.moveTo(50, y).lineTo(50 + tableWidth, y).stroke();
  y += 5;
  
  // Draw rows
  doc.font('Helvetica');
  rows.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 50;
    }
    
    row.forEach((cell, i) => {
      doc.text(cell || '', 50 + (i * columnWidth), y, {
        width: columnWidth,
        align: i === 0 ? 'left' : 'left'
      });
    });
    
    y += rowHeight;
  });
  
  doc.y = y + 10;
}

// Generate CSV report
function generateCSVReport(reportData, res) {
  const { Parser } = require('json2csv');
  let fields, data;
  
  // Format based on report type
  switch (reportData.title) {
    case 'Financial Summary Report':
      // For financial summary, create a simplified CSV
      const financialData = [
        { Category: 'Total Revenue', Value: `$${reportData.summary.totalIncome.toFixed(2)}` },
        { Category: 'Total Expenses', Value: `$${reportData.summary.totalExpenses.toFixed(2)}` },
        { Category: 'Net Profit', Value: `$${reportData.summary.netProfit.toFixed(2)}` },
        { Category: 'Profit Margin', Value: `${reportData.summary.profitMargin}%` },
        { Category: 'Total Invoices', Value: reportData.invoices.total },
        { Category: 'Paid Invoices', Value: reportData.invoices.paid },
        { Category: 'Pending Invoices', Value: reportData.invoices.pending },
        { Category: 'Overdue Invoices', Value: reportData.invoices.overdue }
      ];
      
      // Add payment methods
      reportData.paymentMethods.forEach(method => {
        financialData.push({ 
          Category: `Payment Method: ${method.method}`, 
          Value: `$${method.amount.toFixed(2)} (${method.percentage}%)` 
        });
      });
      
      // Add expenses
      reportData.expenses.forEach(expense => {
        financialData.push({ 
          Category: `Expense: ${expense.category}`, 
          Value: `$${expense.amount.toFixed(2)} (${expense.percentage}%)` 
        });
      });
      
      fields = ['Category', 'Value'];
      data = financialData;
      break;
      
    case 'Invoice Details Report':
      // For invoice details, provide full invoice list
      fields = [
        { label: 'Patient', value: 'patientName' },
        { label: 'Date', value: row => new Date(row.createdAt).toLocaleDateString() },
        { label: 'Due Date', value: row => new Date(row.dueDate).toLocaleDateString() },
        { label: 'Paid Date', value: row => row.paidDate ? new Date(row.paidDate).toLocaleDateString() : '' },
        { label: 'Amount', value: row => `$${row.totalAmount.toFixed(2)}` },
        { label: 'Status', value: 'status' },
        { label: 'Payment Method', value: 'paymentMethod' }
      ];
      data = reportData.invoices;
      break;
      
    case 'Payment Analysis Report':
      // For payment analysis, provide full payment list
      fields = [
        { label: 'Patient', value: 'patientName' },
        { label: 'Date', value: row => new Date(row.paidDate).toLocaleDateString() },
        { label: 'Amount', value: row => `$${row.amount.toFixed(2)}` },
        { label: 'Method', value: 'paymentMethod' }
      ];
      data = reportData.payments;
      break;
      
    case 'Insurance Claims Report':
      // For insurance claims, provide full claims list
      fields = [
        { label: 'Patient', value: 'patientName' },
        { label: 'Provider', value: 'provider' },
        { label: 'Claim Number', value: 'claimNumber' },
        { label: 'Submission Date', value: row => new Date(row.submissionDate).toLocaleDateString() },
        { label: 'Response Date', value: row => row.responseDate ? new Date(row.responseDate).toLocaleDateString() : '' },
        { label: 'Amount', value: row => `$${row.amount.toFixed(2)}` },
        { label: 'Status', value: 'status' },
        { label: 'Notes', value: 'notes' }
      ];
      data = reportData.claims;
      break;
      
    default:
      // Generic format
      fields = Object.keys(reportData.summary || {});
      data = [reportData.summary || {}];
  }
  
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(data);
  
  // Set response headers
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition', 
    `attachment; filename=${reportData.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.csv`
  );
  
  // Send CSV
  res.send(csv);
}

// Generate Excel report
function generateExcelReport(reportData, res) {
  const Excel = require('exceljs');
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet(reportData.title);
  
  // Add report header
  worksheet.mergeCells('A1:E1');
  worksheet.getCell('A1').value = 'MindSpeak Healthcare - Billing Department';
  worksheet.getCell('A1').font = { size: 14, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A2:E2');
  worksheet.getCell('A2').value = reportData.title;
  worksheet.getCell('A2').font = { size: 12, bold: true };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A3:E3');
  worksheet.getCell('A3').value = `Period: ${reportData.dateRange}`;
  worksheet.getCell('A3').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A4:E4');
  worksheet.getCell('A4').value = `Generated: ${new Date().toLocaleString()}`;
  worksheet.getCell('A4').alignment = { horizontal: 'center' };
  
  // Add content based on report type
  let currentRow = 6;
  
  switch (reportData.title) {
    case 'Financial Summary Report':
      // Summary section
      worksheet.getCell(`A${currentRow}`).value = 'Financial Summary';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow += 2;
      
      worksheet.getCell(`A${currentRow}`).value = 'Total Revenue';
      worksheet.getCell(`B${currentRow}`).value = reportData.summary.totalIncome;
      worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
      currentRow++;
      
      worksheet.getCell(`A${currentRow}`).value = 'Total Expenses';
      worksheet.getCell(`B${currentRow}`).value = reportData.summary.totalExpenses;
      worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
      currentRow++;
      
      worksheet.getCell(`A${currentRow}`).value = 'Net Profit';
      worksheet.getCell(`B${currentRow}`).value = reportData.summary.netProfit;
      worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
      currentRow++;
      
      worksheet.getCell(`A${currentRow}`).value = 'Profit Margin';
      worksheet.getCell(`B${currentRow}`).value = reportData.summary.profitMargin + '%';
      currentRow += 2;
      
      // Invoice statistics
      worksheet.getCell(`A${currentRow}`).value = 'Invoice Statistics';
      worksheet.getCell(`A${currentRow}`).font = { bold: true };
      currentRow += 2;
      
      worksheet.getCell(`A${currentRow}`).value = 'Total Invoices';
      worksheet.getCell(`B${currentRow}`).value = reportData.invoices.total;
      currentRow++;
      
      worksheet.getCell(`A${currentRow}`).value = 'Paid Invoices';
      worksheet.getCell(`B${currentRow}`).value = reportData.invoices.paid;
      currentRow++;
      
      worksheet.getCell(`A${currentRow}`).value = 'Pending Invoices';
      worksheet.getCell(`B${currentRow}`).value = reportData.invoices.pending;
      currentRow++;
      
      worksheet.getCell(`A${currentRow}`).value = 'Overdue Invoices';
      worksheet.getCell(`B${currentRow}`).value = reportData.invoices.overdue;
      currentRow += 2;
      
      // Payment Methods
      if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
        worksheet.getCell(`A${currentRow}`).value = 'Payment Methods';
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        currentRow += 1;
        
        // Headers
        worksheet.getCell(`A${currentRow}`).value = 'Method';
        worksheet.getCell(`B${currentRow}`).value = 'Amount';
        worksheet.getCell(`C${currentRow}`).value = 'Percentage';
        worksheet.getRow(currentRow).font = { bold: true };
        currentRow++;
        
        // Data rows
        reportData.paymentMethods.forEach(method => {
          worksheet.getCell(`A${currentRow}`).value = method.method;
          worksheet.getCell(`B${currentRow}`).value = method.amount;
          worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
          worksheet.getCell(`C${currentRow}`).value = method.percentage + '%';
          currentRow++;
        });
        currentRow++;
      }
      
      // Expense Categories
      if (reportData.expenses && reportData.expenses.length > 0) {
        worksheet.getCell(`A${currentRow}`).value = 'Expense Categories';
        worksheet.getCell(`A${currentRow}`).font = { bold: true };
        currentRow += 1;
        
        // Headers
        worksheet.getCell(`A${currentRow}`).value = 'Category';
        worksheet.getCell(`B${currentRow}`).value = 'Amount';
        worksheet.getCell(`C${currentRow}`).value = 'Percentage';
        worksheet.getRow(currentRow).font = { bold: true };
        currentRow++;
        
        // Data rows
        reportData.expenses.forEach(expense => {
          worksheet.getCell(`A${currentRow}`).value = expense.category;
          worksheet.getCell(`B${currentRow}`).value = expense.amount;
          worksheet.getCell(`B${currentRow}`).numFmt = '$#,##0.00';
          worksheet.getCell(`C${currentRow}`).value = expense.percentage + '%';
          currentRow++;
        });
      }
      break;
      
    case 'Invoice Details Report':
      // Similar Excel generation for other report types
      // ... 
      break;
    
    // Other report types
    // ...
  }
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 15;
  });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition', 
    `attachment; filename=${reportData.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.xlsx`
  );
  
  // Write to response
  workbook.xlsx.write(res)
    .catch(error => {
      console.error('Error generating Excel:', error);
      res.status(500).send('Error generating Excel file');
    });
}

module.exports = billingController;