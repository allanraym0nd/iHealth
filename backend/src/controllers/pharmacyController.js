const Pharmacy = require('../models/Pharmacy');
const { AppError } = require('../middleware/errorHandler');
const Prescription = require('../models/Prescription');
const pharmacyController = {

  createProfile: async (req, res) => {
    try {
        const pharmacy = new Pharmacy({
            userId: req.user.id,
            name: req.body.name,
            department: req.body.department,
            position: req.body.position,
            contact: {
                email: req.body.contact.email,
                phone: req.body.contact.phone
            }
        });
        await pharmacy.save();
        res.status(201).json(pharmacy);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
},

  create: async (req, res, next) => {
    try {
      const pharmacy = await Pharmacy.create(req.body);
      res.status(201).json({
        status: "success",
        message: "Pharmacy inventory created",
        data: pharmacy,
      });
    } catch (error) {
      next(error);
    }
  },
  
  createPrescription: async (req, res, next) => {
    try {
      const pharmacy = await Pharmacy.findOne();
      pharmacy.prescriptions.push(req.body);
      await pharmacy.save();

      res.status(201).json({
        status: "success",
        message: "Prescription created",
      });
    } catch (error) {
      next(error);
    }
  },


  createRefillRequest: async (req, res, next) => {
    try {
      const pharmacy = await Pharmacy.findOne();
      
      // Validate required fields
      const { prescription, pharmacyLocation, notes, patient } = req.body;
      
      // Ensure we have a patient ID - either from the body or the logged-in user
      const patientId = patient || req.user.id;
      
      if (!patientId) {
        return res.status(400).json({
          status: 'error',
          message: 'Patient information is required for a refill request'
        });
      }
      
      // Create refill request
      const newRefillRequest = {
        prescription: prescription,
        patient: patientId,
        pharmacyLocation: pharmacyLocation || '',
        notes: notes || '',
        status: 'Pending',
        requestDate: new Date()
      };
      
      console.log('Creating refill request with data:', newRefillRequest);
      
      // Add to pharmacy's refill requests
      pharmacy.refillRequests.push(newRefillRequest);
      await pharmacy.save();
      
      res.status(201).json({
        status: 'success',
        message: 'Refill request created successfully',
        data: newRefillRequest
      });
    } catch (error) {
      console.error('Error creating refill request:', error);
      next(error);
    }
  },
  // In pharmacyController.js
getPrescriptions: async (req, res, next) => {
  try {
    // Fetch prescriptions that are active and ready for pharmacy processing
    const prescriptions = await Prescription.find({ 
      status: 'active' 
    })
    .populate('patient', 'name')
    .populate('doctor', 'name')
    .sort({ createdAt: -1 });

    res.json({
      status: 'success',
      data: prescriptions
    });
  } catch (error) {
    next(error);
  }
},

// Add a method to process prescriptions
processPrescription: async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;
    
    // Update prescription status 
    const prescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      { 
        status: 'completed',
        // You might want to add more processing details
      },
      { new: true }
    );

    // Create a transaction in the pharmacy
    const pharmacy = await Pharmacy.findOne();
    pharmacy.transactions.push({
      patient: prescription.patient,
      medications: prescription.medications.map(med => ({
        name: med.name,
        quantity: med.dosage, // You might need to adjust this logic
        price: 0 // Add pricing logic if needed
      })),
      date: new Date(),
      status: 'Completed'
    });
    await pharmacy.save();

    res.json({
      status: 'success',
      message: 'Prescription processed successfully',
      data: prescription
    });
  } catch (error) {
    next(error);
  }
},
  

  // Get inventory
  getInventory: async (req, res, next) => {
    try {
      const pharmacy = await Pharmacy.findOne();
      if (!pharmacy) {
        throw new AppError('Pharmacy inventory not found', 404);
      }

      res.json({
        status: 'success',
        data: pharmacy.inventoryItems
      });
    } catch (error) {
      next(error);
    }
  },

  addInventoryItem: async (req, res, next) => {
    try {
      const pharmacy = await Pharmacy.findOne();
      pharmacy.inventoryItems.push(req.body);
      await pharmacy.save();
  
      res.status(201).json({
        status: 'success',
        data: pharmacy.inventoryItems[pharmacy.inventoryItems.length - 1]
      });
    } catch (error) {
      next(error);
    }
  },
  // Update inventory
  updateInventoryItem: async (req, res, next) => {
    try {
      const pharmacy = await Pharmacy.findOne();
      const itemIndex = pharmacy.inventoryItems.findIndex(
        item => item._id.toString() === req.params.id
      );
  
      if (itemIndex === -1) {
        return res.status(404).json({
          status: 'error',
          message: 'Inventory item not found'
        });
      }
  
      pharmacy.inventoryItems[itemIndex] = {
        ...pharmacy.inventoryItems[itemIndex],
        ...req.body
      };
      await pharmacy.save();

    res.json({
      status: 'success',
      data: pharmacy.inventoryItems[itemIndex]
    });
  } catch (error) {
    next(error);
  }
},

deleteInventoryItem: async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findOne();
    
    // Find the index of the item to delete
    const itemIndex = pharmacy.inventoryItems.findIndex(
      item => item._id.toString() === req.params.id
    );

    // If item not found, return 404
    if (itemIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Inventory item not found'
      });
    }

    // Remove the item from the inventoryItems array
    pharmacy.inventoryItems.splice(itemIndex, 1);

    // Save the updated pharmacy document
    await pharmacy.save();

    res.json({
      status: 'success',
      message: 'Inventory item deleted successfully',
      data: pharmacy.inventoryItems
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    next(error);
  }
},

  // Handle prescription
  handlePrescription: async (req, res, next) => {
    try {
      const { medications } = req.body;
      const pharmacy = await Pharmacy.findOne();

      // Check if we have enough stock
      for (const med of medications) {
        const inventoryItem = pharmacy.inventoryItems.find(
          item => item.medication === med.name
        );

        if (!inventoryItem) {
          throw new AppError(`${med.name} not found in inventory`, 400);
        }

        if (inventoryItem.quantity < med.quantity) {
          throw new AppError(`Insufficient stock for ${med.name}`, 400);
        }
      }

      // Update inventory quantities
      for (const med of medications) {
        await Pharmacy.updateOne(
          { 'inventoryItems.medication': med.name },
          { $inc: { 'inventoryItems.$.quantity': -med.quantity }}
        );
      }

      // Add to transactions
      pharmacy.transactions.push({
        patient: req.body.patient,
        medications,
        date: new Date(),
        status: 'Completed'
      });

      await pharmacy.save();

      res.json({
        status: 'success',
        message: 'Prescription processed successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  processRefillRequest: async (req, res, next) => {
    try {
      const pharmacy = await Pharmacy.findOne();
      
      const refillRequestIndex = pharmacy.refillRequests.findIndex(
        request => request._id.toString() === req.params.id
      );
  
      if (refillRequestIndex === -1) {
        return res.status(404).json({
          status: 'error',
          message: 'Refill request not found'
        });
      }
      // Update the status
    pharmacy.refillRequests[refillRequestIndex].status = req.body.status;

    await pharmacy.save();

    res.json({
      status: 'success',
      data: pharmacy.refillRequests[refillRequestIndex]
    });
  } catch (error) {
    next(error);
  }
},

  // Handle refill request
  getRefillRequests: async (req, res, next) => {
    try {
      // Find pharmacy or create if not exists
      let pharmacy = await Pharmacy.findOne();
      
      // If no pharmacy exists, create one
      if (!pharmacy) {
        pharmacy = new Pharmacy();
        await pharmacy.save();
      }
      
      // Populate the requests with patient and prescription data
      await Pharmacy.populate(pharmacy, {
        path: 'refillRequests.prescription',
        populate: [
          { path: 'patient', select: 'name' },
          { path: 'doctor', select: 'name' }
        ]
      });
      
      // Populate the patient directly on the refill request
      await Pharmacy.populate(pharmacy, {
        path: 'refillRequests.patient',
        select: 'name'
      });
      
      // Create a more complete response with helpful debug info
      const requests = pharmacy.refillRequests || [];
      
      // Add a better name field for display
      const enhancedRequests = requests.map(request => {
        let patientName = 'Unknown Patient';
        
        // Try to get name from patient field
        if (request.patient) {
          if (typeof request.patient === 'object' && request.patient.name) {
            patientName = request.patient.name;
          }
        }
        // If still unknown, try from prescription
        else if (request.prescription && request.prescription.patient && request.prescription.patient.name) {
          patientName = request.prescription.patient.name;
        }
        
        return {
          ...request.toObject(),
          displayName: patientName
        };
      });
      
      res.json({
        status: 'success',
        data: requests,
        enhancedData: enhancedRequests
      });
    } catch (error) {
      console.error('Detailed error in getRefillRequests:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch refill requests',
        error: error.message
      });
    }
  },

  getPatientRefillRequests: async (req, res, next) => {
    try {
      const pharmacy = await Pharmacy.findOne()
        .populate({
          path: 'refillRequests',
          match: { patient: req.user.id },
          populate: [
            { path: 'prescription', populate: ['doctor', 'medications'] }
          ]
        });
  
      res.json({
        status: 'success',
        data: pharmacy.refillRequests || []
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Add a method to handle refill requests
  handleRefillRequest: async (req, res, next) => {
    try {
      const { prescription, patient, notes } = req.body;
  
      // Find pharmacy or create if not exists
      let pharmacy = await Pharmacy.findOne();
      if (!pharmacy) {
        pharmacy = new Pharmacy();
      }
  
      // Add refill request
      pharmacy.refillRequests.push({
        prescription,
        patient,
        notes,
        status: 'Pending'
      });
  
      await pharmacy.save();
  
      res.status(201).json({
        status: 'success',
        message: 'Refill request created',
        data: pharmacy.refillRequests[pharmacy.refillRequests.length - 1]
      });
    } catch (error) {
      console.error('Error creating refill request:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create refill request',
        error: error.message
      });
    }
  }
  // Get refill requests
  
};

module.exports = pharmacyController;