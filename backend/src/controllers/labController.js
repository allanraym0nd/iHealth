const Lab = require('../models/Lab');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { AppError } = require('../middleware/errorHandler');

const labController = {

  
    create: async (req, res, next) => {
      try {
        const lab = new Lab({
          name: req.body.name,
          department: req.body.department,
          position: req.body.position,
          contact: {
            email: req.body.contact.email,
            phone: req.body.contact.phone
          },
          testOrders: [],
          inventory: req.body.inventory || [],
          reorderRequests: []
        });
        await lab.save();

      res.status(201).json({
        status: 'success',
        data: lab
      });
    } catch (error) {
      next(error);
    }
  },

  getPatientsList: async (req, res, next) => {
    try {
      const patients = await Patient.find().select('name');
      res.json({
        status: 'success',
        data: patients
      });
    } catch (error) {
      next(error);
    }
  },
  
  getDoctorsList: async (req, res, next) => {
    try {
      const doctors = await Doctor.find().select('name');
      res.json({
        status: 'success',
        data: doctors
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Create test order
  createTestOrder: async (req, res, next) => {
    try {
      const lab = await Lab.findOne();
      if (!lab) {
        throw new AppError('Lab not found', 404);
      }
  
      const newTestOrder = {
        patient: req.body.patientId,
        doctor: req.body.doctorId,
        testType: req.body.testType,
        status: 'Pending',
        scheduledDate: req.body.scheduledDate
      };
  
      lab.testOrders.push(newTestOrder);
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

  // Add these methods to your labController object

getPendingTests: async (req, res, next) => {
  try {
    const lab = await Lab.findOne()
      .populate('testOrders.patient')
      .populate('testOrders.doctor');

    const pendingTests = lab ? lab.testOrders.filter(test => 
      test.status === 'Pending'
    ) : [];

    res.json({
      status: 'success',
      data: pendingTests
    });
  } catch (error) {
    next(error);
  }
},

getCompletedTests: async (req, res, next) => {
  try {
    const lab = await Lab.findOne()
      .populate('testOrders.patient')
      .populate('testOrders.doctor');

    const completedTests = lab ? lab.testOrders.filter(test => 
      test.status === 'Completed'
    ) : [];

    res.json({
      status: 'success',
      data: completedTests
    });
  } catch (error) {
    next(error);
  }
},

getInventory: async (req, res, next) => {
  try {
    const lab = await Lab.findOne();
    
    res.json({
      status: 'success',
      data: lab ? lab.inventory : []
    });
  } catch (error) {
    next(error);
  }
},

getReorderRequests: async (req, res, next) => {
  try {
    const lab = await Lab.findOne();
    const reorderRequests = lab ? lab.reorderRequests : [];

    res.json({
      status: 'success',
      data: reorderRequests
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

  updateInventoryItem: async (req, res, next) => {
    try {
      const lab = await Lab.findOne();
      if (!lab) {
        throw new AppError('Lab not found', 404);
      }
  
      const item = lab.inventory.id(req.params.id);
      if (!item) {
        throw new AppError('Inventory item not found', 404);
      }
  
      Object.assign(item, req.body);
      await lab.save();
      res.json({
        status: 'success',
        data: item
      });
    } catch (error) {
      next(error);
    }
  },

  getTestOrders: async (req, res, next) => {
    try {
      const lab = await Lab.findOne()
        .populate('testOrders.patient')
        .populate('testOrders.doctor');

      if (!lab) {
        return res.json({
          status: 'success',
          data: []
        });
      }

      res.json({
        status: 'success',
        data: lab.testOrders
      });
    } catch (error) {
      next(error);
    }
  },

  getSamples: async (req, res, next) => {
    try {
      const lab = await Lab.findOne();
      const testOrders = lab?.testOrders.filter(order => 
        order.status === 'sample_collected' || order.status === 'processing'
      ) || [];
  
      const samples = testOrders.map(order => ({
        _id: order._id,
        sampleId: order._id,
        patient: order.patient,
        type: order.testType,
        collectionDate: order.scheduledDate,
        status: order.status,
        storageLocation: order.sampleDetails?.location || 'Lab Storage'
      }));
  
      res.json({
        status: 'success',
        data: samples
      });
    } catch (error) {
      next(error);
    }
  },

  getTestResults: async (req, res, next) => {
    try {
      const lab = await Lab.findOne()
        .populate('testOrders.patient')
        .populate('testOrders.doctor');
  
      const results = lab?.testOrders.filter(order => 
        order.results && Object.keys(order.results).length > 0
      ).map(order => ({
        _id: order._id,
        patient: order.patient,
        testType: order.testType,
        value: order.results.value,
        unit: order.results.unit,
        referenceRange: order.results.referenceRange,
        interpretation: order.results.interpretation,
        isCritical: order.results.isCritical,
        notes: order.results.notes,
        completedAt: order.results.date
      })) || [];
  
      res.json({
        status: 'success',
        data: results
      });
    } catch (error) {
      next(error);
    }
  },
  
  addTestResult: async (req, res, next) => {
    try {
      const lab = await Lab.findOne();
      
      const testOrder = lab.testOrders.id(req.body.testId);
      if (!testOrder) {
        throw new AppError('Test order not found', 404);
      }
  
      testOrder.results = {
        value: req.body.value,
        unit: req.body.unit,
        referenceRange: req.body.referenceRange,
        interpretation: req.body.interpretation,
        isCritical: req.body.isCritical,
        notes: req.body.notes,
        date: new Date()
      };
      testOrder.status = 'Completed';
  
      await lab.save();
  
      res.json({
        status: 'success',
        data: testOrder
      });
    } catch (error) {
      next(error);
    }
  },
  
  updateTestResult: async (req, res, next) => {
    try {
      const lab = await Lab.findOne();
      
      const testOrder = lab.testOrders.id(req.params.id);
      if (!testOrder) {
        throw new AppError('Test result not found', 404);
      }
  
      Object.assign(testOrder.results, req.body);
      await lab.save();
  
      res.json({
        status: 'success',
        data: testOrder
      });
    } catch (error) {
      next(error);
    }
  },

  // In labController.js
collectSample: async (req, res, next) => {
  try {
    console.log('Request body:', req.body); // Add this for debugging

    const lab = await Lab.findOne();
    if (!lab) {
      throw new AppError('Lab not found', 404);
    }

    const newTestOrder = {
      patient: req.body.patient,
      testType: req.body.testType,
      sampleDetails: {
        collectedAt: req.body.collectionDate,
        location: req.body.storageLocation,
        notes: req.body.notes,
        status: 'collected'
      }
    };

    // Add to test orders
    lab.testOrders.push(newTestOrder);
    await lab.save();

    console.log('Sample collected successfully:', newTestOrder); // Add this for debugging

    res.status(201).json({
      status: 'success',
      data: newTestOrder
    });
  } catch (error) {
    console.error('Error in collectSample:', error); // Add this for debugging
    next(error);
  }
},
  

addInventoryItem: async (req, res, next) => {
  try {
    const lab = await Lab.findOne();
    if (!lab) {
      throw new AppError('Lab not found', 404);
    }

    const newItem = {
      item: req.body.item,
      quantity: Number(req.body.quantity),
      reorderLevel: Number(req.body.reorderLevel),
      unit: req.body.unit,
      category: req.body.category,
      location: req.body.location,
      notes: req.body.notes,
      lastRestocked: new Date()
    };

    lab.inventory.push(newItem);
    await lab.save();

    res.status(201).json({
      status: 'success',
      data: newItem
    });
  } catch (error) {
    next(error);
  }
},

  // Create reorder request
  createReorderRequest: async (req, res, next) => {
    try {
      const lab = await Lab.findOne();
      if (!lab) {
        throw new AppError('Lab not found', 404);
      }
  
      const reorderRequest = {
        item: req.body.item,
        quantity: req.body.quantity,
        requestDate: new Date(),
        status: 'Pending'
      };
  
      lab.reorderRequests.push(reorderRequest);
      await lab.save();
      res.status(201).json({
        status: 'success',
        data: reorderRequest
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = labController;