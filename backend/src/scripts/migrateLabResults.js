const mongoose = require('mongoose');
require('dotenv').config();
const Lab = require('../models/Lab');

const migrateLabResults = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the lab document
    const lab = await Lab.findOne();
    if (!lab) {
      console.log('No lab found in database');
      process.exit(0);
    }

    // Log initial state
    console.log(`Found ${lab.testOrders.length} test orders to migrate`);

    // Update each test order
    lab.testOrders = lab.testOrders.map(order => {
      // If order has no results, initialize with empty structure
      if (!order.results) {
        order.results = {
          value: '',
          unit: '',
          referenceRange: '',
          interpretation: '',
          isCritical: false,
          notes: '',
          date: new Date()
        };
      } 
      // If order has old results structure, migrate it
      else if (order.results.data) {
        const oldResults = order.results;
        order.results = {
          value: oldResults.data?.value || '',
          unit: oldResults.data?.unit || '',
          referenceRange: oldResults.data?.referenceRange || '',
          interpretation: oldResults.data?.interpretation || '',
          isCritical: oldResults.data?.isCritical || false,
          notes: oldResults.notes || '',
          date: oldResults.date || new Date()
        };
      }
      return order;
    });

    // Save the updated lab document
    await lab.save();

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateLabResults();