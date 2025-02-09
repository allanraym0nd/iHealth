const Pharmacy = require('../models/Pharmacy');
const { AppError } = require('../middleware/errorHandler');

const pharmacyController = {

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

  getPrescriptions: async (req, res, next) => {
    try {
      const pharmacy = await Pharmacy.findOne().populate('prescriptions');
      res.json({
        status: 'success',
        data: pharmacy.prescriptions
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

  // Update inventory
  updateInventory: async (req, res, next) => {
    try {
      const pharmacy = await Pharmacy.findOneAndUpdate(
        {},
        { $set: { inventoryItems: req.body }},
        { new: true, runValidators: true }
      );

      // Check for low stock items
      const lowStockItems = pharmacy.inventoryItems.filter(
        item => item.quantity <= item.reorderLevel
      );

      res.json({
        status: 'success',
        data: pharmacy.inventoryItems,
        alerts: lowStockItems.length > 0 ? {
          lowStock: lowStockItems.map(item => ({
            medication: item.medication,
            quantity: item.quantity
          }))
        } : null
      });
    } catch (error) {
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

  // Handle refill request
  handleRefillRequest: async (req, res, next) => {
    try {
      const pharmacy = await Pharmacy.findOne();
      
      // Validate prescription existence
      const prescriptionExists = await pharmacy.prescriptions.id(req.body.prescription);
      if (!prescriptionExists) {
        throw new AppError('Prescription not found', 404);
      }

      // Check if refill is allowed
      if (prescriptionExists.refillsRemaining <= 0) {
        throw new AppError('No refills remaining for this prescription', 400);
      }

      pharmacy.refillRequests.push({
        prescription: req.body.prescription,
        patient: req.body.patient,
        requestDate: new Date(),
        status: 'Pending',
        notes: req.body.notes
      });

      await pharmacy.save();

      res.status(201).json({
        status: 'success',
        message: 'Refill request submitted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get refill requests
  getRefillRequests: async (req, res, next) => {
    try {
      const pharmacy = await Pharmacy.findOne()
        .populate('refillRequests.prescription')
        .populate('refillRequests.patient');

      res.json({
        status: 'success',
        data: pharmacy.refillRequests
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = pharmacyController;