// migration-fix-invoice-dates.js
const mongoose = require('mongoose');
const Billing = require('../models/Billing'); 
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get all billing records
      const billings = await Billing.find({});
      console.log(`Found ${billings.length} billing records`);
      
      // Counter for updated invoices
      let updatedInvoiceCount = 0;
      let totalInvoiceCount = 0;
      
      // Process each billing record
      for (const billing of billings) {
        let modified = false;
        
        if (billing.invoices && billing.invoices.length > 0) {
          totalInvoiceCount += billing.invoices.length;
          
          // Check each invoice
          billing.invoices.forEach(invoice => {
            // If createdAt is missing or invalid
            if (!invoice.createdAt || isNaN(new Date(invoice.createdAt).getTime())) {
              console.log(`Fixing date for invoice ${invoice._id}`);
              
              // Use dueDate as reference, or document creation date, or fallback to 30 days ago
              let newDate;
              
              if (invoice.dueDate && !isNaN(new Date(invoice.dueDate).getTime())) {
                // If due date exists, set createdAt to 30 days before due date
                newDate = new Date(new Date(invoice.dueDate).getTime() - (30 * 24 * 60 * 60 * 1000));
              } else if (billing.createdAt && !isNaN(new Date(billing.createdAt).getTime())) {
                // If billing record has a valid creation date, use it
                newDate = new Date(billing.createdAt);
              } else {
                // Last resort: set to current date minus random days (to create variety)
                const randomDays = Math.floor(Math.random() * 60) + 1; // 1-60 days ago
                newDate = new Date(Date.now() - (randomDays * 24 * 60 * 60 * 1000));
              }
              
              // Update invoice createdAt
              invoice.createdAt = newDate;
              modified = true;
              updatedInvoiceCount++;
            }
          });
        }
        
        // Save if modified
        if (modified) {
          await billing.save();
          console.log(`Updated invoices in billing record ${billing._id}`);
        }
      }
      
      console.log(`Migration complete: Updated ${updatedInvoiceCount} out of ${totalInvoiceCount} invoices`);
    } catch (err) {
      console.error('Error during migration:', err);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });