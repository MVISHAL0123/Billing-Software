import Customer from '../models/Customer.js';

// Add new customer
export const addCustomer = async (req, res) => {
  try {
    const { customerName, place, phoneNumber } = req.body;

    // Validate input
    if (!customerName || !place || !phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Customer name, place, and phone number are required!' 
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

    // Create new customer
    const customer = new Customer({
      customerName: customerName.trim(),
      place: place.trim(),
      phoneNumber: phoneNumber.trim(),
      createdBy: req.user.userId
    });

    const savedCustomer = await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer added successfully!',
      customer: savedCustomer.toJSON()
    });
  } catch (error) {
    console.error('Add customer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Get all customers
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll();

    res.json({
      success: true,
      customers: customers.map(customer => customer.toJSON())
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Get customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found!' 
      });
    }

    res.json({
      success: true,
      customer: customer.toJSON()
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { customerName, place, phoneNumber } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found!' 
      });
    }

    // Validate phone number if provided
    if (phoneNumber) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phoneNumber.trim())) {
        return res.status(400).json({ 
          success: false, 
          message: 'Phone number must be 10 digits!' 
        });
      }
    }

    // Update fields
    if (customerName) customer.customerName = customerName.trim();
    if (place) customer.place = place.trim();
    if (phoneNumber) customer.phoneNumber = phoneNumber.trim();

    const updatedCustomer = await customer.save();

    res.json({
      success: true,
      message: 'Customer updated successfully!',
      customer: updatedCustomer.toJSON()
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found!' 
      });
    }

    await Customer.deleteById(req.params.id);

    res.json({
      success: true,
      message: 'Customer deleted successfully!'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};
