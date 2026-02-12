import Bill from '../models/Bill.js';
import Product from '../models/Product.js';
import firebaseService from '../services/firebaseService.js';

// Create a new bill
export const createBill = async (req, res) => {
  try {
    const { billNo, date, customer, items, subtotal, total } = req.body;

    // Validate required fields
    if (!billNo || !date || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create bill data
    const billData = {
      billNo,
      date: new Date(date),
      customer: customer ? {
        customerId: customer.id || null,
        customerName: customer.customerName || 'Walk-in Customer',
        phoneNumber: customer.phoneNumber || '',
        place: customer.place || ''
      } : {
        customerId: null,
        customerName: 'Walk-in Customer',
        phoneNumber: '',
        place: ''
      },
      items,
      subtotal,
      total,
      createdBy: req.user.userId || req.user.id || req.user.username
    };

    // Calculate total profit and margin
    let totalProfit = 0;
    for (const item of items) {
      totalProfit += (item.totalProfit || 0);
    }
    billData.totalProfit = totalProfit;
    billData.marginPercentage = subtotal > 0 ? ((totalProfit / subtotal) * 100).toFixed(2) : 0;

    const bill = new Bill(billData);
    const savedBill = await bill.save();

    // Reserve (increment) the bill number counter after successful save
    await firebaseService.reserveBillNumber();

    // Update product stocks - reduce stock for sales
    for (const item of items) {
      try {
        // Find the product by name (case-insensitive search using Firebase)
        const products = await Product.findAll();
        let product = products.find(p => 
          p.productName.toLowerCase() === item.productName.toLowerCase()
        );

        if (product) {
          // Check if sufficient stock is available
          if (product.currentStock >= parseInt(item.qty)) {
            // Reduce stock for sale
            product.currentStock -= parseInt(item.qty);
            await product.save();
          } else {
            console.warn(`Insufficient stock for product ${item.productName}. Available: ${product.currentStock}, Required: ${item.qty}`);
            // Still process the sale but log a warning
          }
        } else {
          console.warn(`Product ${item.productName} not found in inventory`);
          // Still process the sale but log a warning
        }
      } catch (itemError) {
        console.error(`Error updating stock for product ${item.productName}:`, itemError);
        // Continue with other items even if one fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Bill created successfully and stocks updated',
      bill: savedBill.toJSON()
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: 'Bill number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating bill',
      error: error.message
    });
  }
};

// Get all bills
export const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.findAll();

    res.json({
      success: true,
      bills: bills.map(bill => bill.toJSON())
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bills',
      error: error.message
    });
  }
};

// Get bill by ID
export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      bill: bill.toJSON()
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bill',
      error: error.message
    });
  }
};

// Get bill by bill number
export const getBillByNumber = async (req, res) => {
  try {
    const bill = await Bill.findByBillNo(req.params.billNo);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    res.json({
      success: true,
      bill: bill.toJSON()
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bill',
      error: error.message
    });
  }
};

// Delete bill
export const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    await Bill.deleteById(req.params.id);

    res.json({
      success: true,
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting bill',
      error: error.message
    });
  }
};

// Delete all bills
export const deleteAllBills = async (req, res) => {
  try {
    const deletedCount = await Bill.deleteAllBills();

    res.json({
      success: true,
      message: `Deleted ${deletedCount} bills successfully`,
      deletedCount: deletedCount
    });
  } catch (error) {
    console.error('Error deleting all bills:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting all bills',
      error: error.message
    });
  }
};

// Get next bill number
export const getNextBillNumber = async (req, res) => {
  try {
    // Use Firebase service to generate auto-incrementing bill number
    const nextBillNo = await firebaseService.generateBillNumber();

    res.json({
      success: true,
      nextBillNo: nextBillNo
    });
  } catch (error) {
    console.error('Error getting next bill number:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting next bill number',
      error: error.message
    });
  }
};
