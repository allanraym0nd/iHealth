const Lab = require('../models/Lab');
const { AppError } = require('../middleware/errorHandler');

const labController = {
  // Create test order
  createTestOrder: async (req, res, next) => {
    try {
      const lab = await Lab.findOne();
      
      // Validate available capacity
      const todaysTests = lab.testOrders.filter(
        test => test.scheduledDate.toDateString() === new Date(req.body.scheduledDate).toDateString()
      );

      if (todaysTests.length >= 20) { // Assuming max 20 tests per day
        throw new AppError('No available slots for this date', 400);
      }

      lab.testOrders.push({
        patient: req.body.patient,
        doctor: req.body.doctor,
        testType: req.body.testType,
        status: 'Pending',
        scheduledDate: req.body.scheduledDate
      });

      await lab.save();

      res.status(201).json({
        status: 'success',
        data: lab.testOrders[lab.testOrders.length - 1]
      });
    } catch (error) {
      next(error);
    }
  },

  // Update test status
  updateTestStatus: async (req, res, next) => {
    try {
      const lab = await Lab.findOneAndUpdate(
        { "testOrders._id": req.params.id },
        { 
          $set: { 
            "testOrders.$.status": req.body.status 
          }
        },
        { new: true }
      );

      if (!lab) {
        throw new AppError('Test order not found', 404);
      }

      res.json({
        status: 'success',
        data: lab.testOrders.id(req.params.id)
      });
    } catch (error) {
      next(error);
    }
  },

  // Record test results
  recordTestResults: async (req, res, next) => {
    try {
      const lab = await Lab.findOne({ "testOrders._id": req.params.id });
      
      if (!lab) {
        throw new AppError('Test order not found', 404);
      }

      const testOrder = lab.testOrders.id(req.params.id);
      
      if (testOrder.status === 'Completed') {
        throw new AppError('Test results already recorded', 400);
      }

      const updatedLab = await Lab.findOneAndUpdate(
        { "testOrders._id": req.params.id },
        { 
          $set: { 
            "testOrders.$.results": req.body.results,
            "testOrders.$.status": "Completed"
          }
        },
        { new: true }
      );

      res.json({
        status: 'success',
        data: updatedLab.testOrders.id(req.params.id)
      });
    } catch (error) {
      next(error);
    }
  },

  // Update inventory
  updateInventory: async (req, res, next) => {
    try {
      const lab = await Lab.findOneAndUpdate(
        {},
        { $set: { inventory: req.body }},
        { new: true }
      );

      // Check for low stock items
      const lowStockItems = lab.inventory.filter(
        item => item.quantity <= item.reorderLevel
      );

      res.json({
        status: 'success',
        data: lab.inventory,
        alerts: lowStockItems.length > 0 ? {
          lowStock: lowStockItems
        } : null
      });
    } catch (error) {
      next(error);
    }
  },

  // Create reorder request
  createReorderRequest: async (req, res, next) => {
    try {
      const lab = await Lab.findOne();
      
      lab.reorderRequests.push({
        item: req.body.item,
        quantity: req.body.quantity,
        requestDate: new Date(),
        status: 'Pending'
      });

      await lab.save();

      res.status(201).json({
        status: 'success',
        data: lab.reorderRequests[lab.reorderRequests.length - 1]
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = labController;