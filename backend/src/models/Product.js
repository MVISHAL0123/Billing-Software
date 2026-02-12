import firebaseService from '../services/firebaseService.js';

class Product {
  constructor(data = {}) {
    this.id = data.id || null;
    this.productName = data.productName || '';
    this.tamilName = data.tamilName || '';
    this.purchaseRate = data.purchaseRate || 0;
    this.salesRate = data.salesRate || 0;
    this.marginPercentage = data.marginPercentage || 0;
    this.currentStock = data.currentStock || 0;
    this.margin = data.margin || 0;
    this.minStockLevel = data.minStockLevel || 0;
    this.createdBy = data.createdBy || '';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static collection = 'products';

  // Validate product data
  validate() {
    const errors = [];
    
    if (!this.productName || this.productName.trim() === '') {
      errors.push('Product name is required');
    }
    
    if (this.purchaseRate < 0) {
      errors.push('Purchase rate must be non-negative');
    }
    
    if (this.salesRate < 0) {
      errors.push('Sales rate must be non-negative');
    }
    
    if (this.currentStock < 0) {
      errors.push('Current stock must be non-negative');
    }
    
    if (this.minStockLevel < 0) {
      errors.push('Minimum stock level must be non-negative');
    }
    
    if (!this.createdBy || this.createdBy.trim() === '') {
      errors.push('Created by is required');
    }
    
    return errors;
  }

  // Calculate margin before saving
  calculateMargin() {
    if (this.purchaseRate > 0) {
      this.margin = this.salesRate - this.purchaseRate;
      this.marginPercentage = ((this.margin / this.purchaseRate) * 100).toFixed(2);
    }
  }

  // Save product to Firestore
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    // Calculate margin before saving
    this.calculateMargin();

    const productData = {
      productName: this.productName.trim(),
      tamilName: this.tamilName.trim(),
      purchaseRate: parseFloat(this.purchaseRate),
      salesRate: parseFloat(this.salesRate),
      marginPercentage: parseFloat(this.marginPercentage),
      currentStock: parseInt(this.currentStock),
      margin: parseFloat(this.margin),
      minStockLevel: parseInt(this.minStockLevel),
      createdBy: this.createdBy
    };

    if (this.id) {
      // Update existing product
      const updated = await firebaseService.update(Product.collection, this.id, productData);
      return new Product(updated);
    } else {
      // Create new product
      const created = await firebaseService.create(Product.collection, productData);
      return new Product(created);
    }
  }

  // Static methods
  static async findById(id) {
    const productData = await firebaseService.findById(Product.collection, id);
    return productData ? new Product(productData) : null;
  }

  static async findAll() {
    const products = await firebaseService.findAll(Product.collection);
    return products.map(product => new Product(product));
  }

  static async findOne(filters = []) {
    const productData = await firebaseService.findOne(Product.collection, filters);
    return productData ? new Product(productData) : null;
  }

  static async findByName(productName) {
    return await Product.findOne([{ field: 'productName', operator: '==', value: productName }]);
  }

  static async deleteById(id) {
    return await firebaseService.delete(Product.collection, id);
  }

  // Instance methods
  toJSON() {
    return {
      id: this.id,
      productName: this.productName,
      tamilName: this.tamilName,
      purchaseRate: this.purchaseRate,
      salesRate: this.salesRate,
      marginPercentage: this.marginPercentage,
      currentStock: this.currentStock,
      margin: this.margin,
      minStockLevel: this.minStockLevel,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Product;
