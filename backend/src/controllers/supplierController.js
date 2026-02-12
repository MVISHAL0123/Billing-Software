import Supplier from '../models/Supplier.js';

// Add new supplier
export const addSupplier = async (req, res) => {
  try {
    const { supplierName, place, phoneNumber } = req.body;

    // Validate input
    if (!supplierName || !place || !phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Supplier name, place, and phone number are required!' 
      });
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number must be 10 digits!' 
      });
    }

    // Create new supplier
    const supplier = new Supplier({
      supplierName: supplierName.trim(),
      place: place.trim(),
      phoneNumber: phoneNumber.trim(),
      createdBy: req.user.userId
    });

    const savedSupplier = await supplier.save();

    res.status(201).json({
      success: true,
      message: 'Supplier added successfully!',
      supplier: savedSupplier.toJSON()
    });
  } catch (error) {
    console.error('Add supplier error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Get all suppliers
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll();

    res.json({
      success: true,
      suppliers: suppliers.map(supplier => supplier.toJSON())
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Get supplier by ID
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ 
        success: false, 
        message: 'Supplier not found!' 
      });
    }

    res.json({
      success: true,
      supplier: supplier.toJSON()
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Update supplier
export const updateSupplier = async (req, res) => {
  try {
    const { supplierName, place, phoneNumber } = req.body;

    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ 
        success: false, 
        message: 'Supplier not found!' 
      });
    }

    // Validate input
    if (!supplierName || !place || !phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Supplier name, place, and phone number are required!' 
      });
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number must be 10 digits!' 
      });
    }

    // Update supplier
    supplier.supplierName = supplierName.trim();
    supplier.place = place.trim();
    supplier.phoneNumber = phoneNumber.trim();

    const savedSupplier = await supplier.save();

    res.json({
      success: true,
      message: 'Supplier updated successfully!',
      supplier: savedSupplier.toJSON()
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Delete supplier
export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ 
        success: false, 
        message: 'Supplier not found!' 
      });
    }

    await Supplier.deleteById(req.params.id);

    res.json({
      success: true,
      message: 'Supplier deleted successfully!'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};