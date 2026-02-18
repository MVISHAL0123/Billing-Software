import Product from '../models/Product.js';
import { translateText } from '../utils/translateService.js';

// Add new product
export const addProduct = async (req, res) => {
  try {
    const { productName, tamilName, purchaseRate, salesRate, marginPercentage } = req.body;

    // Validate input
    if (!productName || !purchaseRate || !salesRate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product name, purchase rate, and sales rate are required!' 
      });
    }

    // Validate rates
    if (parseFloat(purchaseRate) <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Purchase rate must be greater than 0!' 
      });
    }

    if (parseFloat(salesRate) <= parseFloat(purchaseRate)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sales rate must be greater than purchase rate!' 
      });
    }

    // Create new product
    const product = new Product({
      productName: productName.trim(),
      tamilName: tamilName?.trim() || '',
      purchaseRate: parseFloat(purchaseRate),
      salesRate: parseFloat(salesRate),
      marginPercentage: parseFloat(marginPercentage || 0),
      createdBy: req.user.userId
    });

    const savedProduct = await product.save();

    // Auto-translate Tamil name if not provided
    if (!savedProduct.tamilName) {
      try {
        const translatedName = await translateText(productName, 'ta');
        savedProduct.tamilName = translatedName;
        await savedProduct.save();
      } catch (error) {
        console.error('Translation error during save:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Product added successfully!',
      product: savedProduct.toJSON()
    });
  } catch (error) {
    console.error('Add product error:', error);
    
    // Check if this is a Firebase configuration error
    if (error.message && error.message.includes('Firebase not connected')) {
      return res.status(503).json({ 
        success: false, 
        message: '🔥 Database not configured. Please set up Firebase credentials to add products.',
        error: 'FIREBASE_NOT_CONFIGURED'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.',
      error: error.message
    });
  }
};

// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();

    res.json({
      success: true,
      products: products.map(product => product.toJSON())
    });
  } catch (error) {
    console.error('Get products error:', error);
    
    // Check if this is a Firebase configuration error
    if (error.message && error.message.includes('Firebase not connected')) {
      return res.status(503).json({ 
        success: false, 
        message: '🔥 Database not configured. Please set up Firebase credentials to access product data.',
        error: 'FIREBASE_NOT_CONFIGURED'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.',
      error: error.message
    });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found!' 
      });
    }

    res.json({
      success: true,
      product: product.toJSON()
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { productName, tamilName, purchaseRate, salesRate, marginPercentage } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found!' 
      });
    }

    // Update product name and auto-translate if needed
    if (productName) {
      product.productName = productName.trim();
      
      // Auto-translate to Tamil if not provided
      if (!tamilName || !tamilName.trim()) {
        try {
          const translatedName = await translateText(productName, 'ta');
          product.tamilName = translatedName;
        } catch (error) {
          console.error('Translation error:', error);
          product.tamilName = productName;
        }
      } else {
        product.tamilName = tamilName.trim();
      }
    } else if (tamilName !== undefined) {
      product.tamilName = tamilName.trim();
    }
    
    if (purchaseRate) product.purchaseRate = parseFloat(purchaseRate);
    if (salesRate) product.salesRate = parseFloat(salesRate);
    if (marginPercentage !== undefined) product.marginPercentage = parseFloat(marginPercentage);

    const savedProduct = await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully!',
      product: savedProduct.toJSON()
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found!' 
      });
    }

    await Product.deleteById(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully!'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// Update product prices and refresh all related data
export const updateProductPrices = async (req, res) => {
  try {
    const { productId, purchaseRate, salesRate, margin, marginPercentage } = req.body;

    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const updateData = {};
    if (purchaseRate !== undefined) updateData.purchaseRate = parseFloat(purchaseRate);
    if (salesRate !== undefined) updateData.salesRate = parseFloat(salesRate);
    if (margin !== undefined) updateData.margin = parseFloat(margin);
    if (marginPercentage !== undefined) updateData.marginPercentage = parseFloat(marginPercentage);

    // Update the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update fields
    if (purchaseRate !== undefined) product.purchaseRate = parseFloat(purchaseRate);
    if (salesRate !== undefined) product.salesRate = parseFloat(salesRate);
    if (margin !== undefined) product.margin = parseFloat(margin);
    if (marginPercentage !== undefined) product.marginPercentage = parseFloat(marginPercentage);
    
    const updatedProduct = await product.save();

    res.json({
      success: true,
      message: 'Product prices updated successfully',
      product: updatedProduct.toJSON()
    });

  } catch (error) {
    console.error('Error updating product prices:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product prices',
      error: error.message
    });
  }
};
