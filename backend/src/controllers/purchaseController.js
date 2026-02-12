import Purchase from '../models/Purchase.js';
import Product from '../models/Product.js';
import firebaseService from '../services/firebaseService.js';
import admin from 'firebase-admin';

// Create a new purchase
export const createPurchase = async (req, res) => {
  try {
    const { billNo, grnNo, date, supplier, items, subtotal, total } = req.body;

    console.log('Create purchase request received');
    console.log('User from token:', req.user);
    console.log('Request body:', { billNo, grnNo, date, supplier: supplier?.supplierName, itemsCount: items?.length });

    // Validate required fields
    if (!billNo || !grnNo || !date || !supplier || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create purchase data
    const purchaseData = {
      billNo,
      grnNo,
      date: admin.firestore.Timestamp.fromDate(new Date(date)),
      supplier: {
        supplierId: supplier.id,
        supplierName: supplier.supplierName,
        phoneNumber: supplier.phoneNumber,
        place: supplier.place
      },
      items,
      subtotal,
      total,
      createdBy: req.user.userId || req.user.id || req.user.username
    };

    console.log('Purchase data to save:', { ...purchaseData, createdBy: purchaseData.createdBy });

    const purchase = new Purchase(purchaseData);
    const savedPurchase = await purchase.save();

    // Reserve (increment) the GRN number counter after successful save
    await firebaseService.reserveGRNNumber();
    
    // Get the next GRN number for response
    const nextGrnNo = await firebaseService.generateGRNNumber();

    // Update product stocks and prices
    for (const item of items) {
      try {
        // Find the product by name (case-insensitive search using Firebase)
        const products = await Product.findAll();
        let product = products.find(p => 
          p.productName.toLowerCase() === item.productName.toLowerCase()
        );

        if (product) {
          // Update existing product
          product.currentStock += parseInt(item.qty) + parseInt(item.freeQty || 0);
          product.purchaseRate = item.purchaseRate;
          if (item.salesRate > 0) {
            product.salesRate = item.salesRate;
          }
          product.margin = item.margin || 0;
          product.marginPercentage = item.marginPercentage || 0;
          
          await product.save();
        } else {
          // Create new product if it doesn't exist
          product = new Product({
            productName: item.productName,
            currentStock: parseInt(item.qty) + parseInt(item.freeQty || 0),
            purchaseRate: item.purchaseRate,
            salesRate: item.salesRate || 0,
            margin: item.margin || 0,
            marginPercentage: item.marginPercentage || 0,
            createdBy: req.user.userId || req.user.id || req.user.username
          });
          
          await product.save();
        }
      } catch (itemError) {
        console.error(`Error updating product ${item.productName}:`, itemError);
        // Continue with other items even if one fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Purchase created successfully and stocks updated',
      purchase: savedPurchase.toJSON(),
      nextGrnNo: nextGrnNo
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    console.error('Error stack:', error.stack);
    
    // Handle duplicate error
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: 'Purchase bill number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error creating purchase',
      error: error.message,
      details: error.stack
    });
  }
};

// Get all purchases
export const getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.findAll();

    res.json({
      success: true,
      purchases: purchases.map(purchase => purchase.toJSON())
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases',
      error: error.message
    });
  }
};

// Get next GRN number
export const getNextGrnNumber = async (req, res) => {
  try {
    // Use Firebase service to generate auto-incrementing GRN number
    const nextGrnNo = await firebaseService.generateGRNNumber();

    res.json({
      success: true,
      nextGrnNo: nextGrnNo
    });
  } catch (error) {
    console.error('Error getting next GRN number:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting next GRN number',
      error: error.message
    });
  }
};

// Get purchase by ID
export const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.json({
      success: true,
      purchase: purchase.toJSON()
    });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase',
      error: error.message
    });
  }
};

// Get purchase by bill number
export const getPurchaseByBillNumber = async (req, res) => {
  try {
    const purchase = await Purchase.findByBillNo(req.params.billNo);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.json({
      success: true,
      purchase: purchase.toJSON()
    });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase',
      error: error.message
    });
  }
};

// Delete purchase
export const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    await Purchase.deleteById(req.params.id);

    res.json({
      success: true,
      message: 'Purchase deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting purchase',
      error: error.message
    });
  }
};

// Delete all purchases
export const deleteAllPurchases = async (req, res) => {
  try {
    const deletedCount = await firebaseService.batchDelete(Purchase.collection, { 
      field: 'billNo', 
      operator: '!=', 
      value: '' 
    });

    res.json({
      success: true,
      message: `Deleted ${deletedCount} purchases successfully`,
      deletedCount: deletedCount
    });
  } catch (error) {
    console.error('Error deleting all purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting all purchases',
      error: error.message
    });
  }
};