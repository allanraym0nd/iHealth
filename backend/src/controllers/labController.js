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
      console.log('Received in controller:', req.body);
      
      // Validate input
      if (!req.body.patient) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Patient is required' 
        });
      }
      if (!req.body.doctor) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Doctor is required' 
        });
      }
      if (!req.body.testType) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Test type is required' 
        });
      }
      if (!req.body.scheduledDate) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Scheduled date is required' 
        });
      }
  
      const lab = await Lab.findOne();
      if (!lab) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Lab not found' 
        });
      }
  
      const newTestOrder = {
        patient: req.body.patient,
        doctor: req.body.doctor,
        testType: req.body.testType,
        status: 'Pending',
        scheduledDate: req.body.scheduledDate
      };
  
      lab.testOrders.push(newTestOrder);
      await lab.save();
  
      res.status(201).json({
        status: 'success',
        data: newTestOrder
      });
    } catch (error) {
      console.error('Create test order error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        details: error.message
      });
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

getTestsReadyForResults: async (req, res, next) => {
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

    // Find tests with collected samples but no results yet
    const testsReadyForResults = lab.testOrders.filter(test => 
      test.status === 'sample_collected' || 
      test.status === 'In Progress' ||
      (lab.samples && lab.samples.some(sample => 
        sample.testOrderId && 
        sample.testOrderId.toString() === test._id.toString() && 
        sample.status === 'collected'
      ))
    );

    res.json({
      status: 'success',
      data: testsReadyForResults
    });
  } catch (error) {
    console.error('Error getting tests ready for results:', error);
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
      const lab = await Lab.findOne()
        .populate('samples.patient', 'name');  // Only populate patient, removed TestOrder reference
  
      res.json({
        status: 'success',
        data: lab.samples || []
      });
    } catch (error) {
      next(error);
    }
  },

  getTestResults: async (req, res, next) => {
    try {
      const lab = await Lab.findOne()
        .populate('testOrders.patient', 'name')
        .populate('testOrders.doctor', 'name');
  
      const results = lab ? lab.testOrders.filter(order => {
        // Only include orders with results
        return (
          order.status === 'Completed' && 
          order.results && 
          Object.keys(order.results).length > 0 &&
          order.patient
        );
      }).map(order => ({
        _id: order._id,
        patient: order.patient,
        testType: order.testType,
        value: order.results.value,
        unit: order.results.unit,
        referenceRange: order.results.referenceRange,
        interpretation: order.results.interpretation,
        isCritical: order.results.isCritical || false,
        notes: order.results.notes || ''
      })) : [];
  
      console.log('Sending test results:', results);
  
      res.json({
        status: 'success',
        data: results
      });
    } catch (error) {
      console.error('Error fetching test results:', error);
      next(error);
    }
  },

  addTestResult: async (req, res, next) => {
    try {
      const lab = await Lab.findOne();
      
      const testOrder = lab.testOrders.id(req.body.testId);
      if (!testOrder) {
        return res.status(404).json({
          status: 'error',
          message: 'Test order not found'
        });
      }
  
      // Ensure comprehensive result recording
      testOrder.results = {
        value: req.body.value,
        unit: req.body.unit,
        referenceRange: req.body.referenceRange,
        interpretation: req.body.interpretation,
        isCritical: req.body.isCritical || false,
        notes: req.body.notes || '',
        date: new Date()
      };
      testOrder.status = 'Completed';
  
      await lab.save();
  
      res.json({
        status: 'success',
        data: testOrder
      });
    } catch (error) {
      console.error('Error adding test result:', error);
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
     // Enhanced logging
     console.log('Collect Sample Request Body:', JSON.stringify(req.body, null, 2));

     // Validate required fields
     if (!req.body.patient) {
       return res.status(400).json({
         status: 'error',
         message: 'Patient is required'
       });
     }

     if (!req.body.testType) {
       return res.status(400).json({
         status: 'error',
         message: 'Test type is required'
       });
     }

     const lab = await Lab.findOne();
     if (!lab) {
       return res.status(404).json({
         status: 'error',
         message: 'Lab not found'
       });
     }

     // Log test orders for debugging
     console.log('Lab Test Orders:', JSON.stringify(lab.testOrders, null, 2));

     // More robust test order finding
     const testOrder = lab.testOrders.find(order => {
       // Defensive check to prevent toString() on undefined
       if (!order.patient) {
         console.log('Skipping order with undefined patient:', order);
         return false;
       }
       return order.patient.toString() === req.body.patient &&
              order.testType === req.body.testType;
     });

     // Log found test order
     console.log('Matched Test Order:', testOrder);

     if (testOrder) {
       testOrder.status = 'sample_collected';
       testOrder.sampleDetails = {
         collectedAt: req.body.collectionDate,
         location: req.body.storageLocation,
         notes: req.body.notes
       };
     }

     // Ensure samples collection exists
     if (!lab.samples) {
       lab.samples = [];
     }

     // Create new sample
     const newSample = {
       testOrderId: testOrder?._id,
       patient: req.body.patient,
       testType: req.body.testType,
       collectionDate: req.body.collectionDate,
       storageLocation: req.body.storageLocation,
       notes: req.body.notes || '',
       status: 'collected'
     };

     // Add sample to collection
     lab.samples.push(newSample);

     // Save with error handling
     try {
       await lab.save();
     } catch (saveError) {
       console.error('Error saving lab document:', saveError);
       return res.status(500).json({
         status: 'error',
         message: 'Failed to save sample',
         details: saveError.message
       });
     }

     res.status(201).json({
       status: 'success',
       data: newSample
     });
   } catch (error) {
     console.error('Critical Error in collectSample:', error);
     next(error);
   }
},
  
  updateSampleStatus: async (req, res, next) => {
    try {
      const lab = await Lab.findOne({ 'samples._id': req.params.id });
      if (!lab) {
        throw new AppError('Sample not found', 404);
      }

      const sample = lab.samples.id(req.params.id);
      if (!sample) {
        throw new AppError('Sample not found', 404);
      }

      sample.status = req.body.status;
      await lab.save();

      res.json({
        status: 'success',
        data: sample
      });
    } catch (error) {
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