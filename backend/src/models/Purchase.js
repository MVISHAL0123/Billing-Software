import firebaseService from '../services/firebaseService.js';

class Purchase {
  constructor(data = {}) {
    this.id = data.id || null;
    this.billNo = data.billNo || '';
    this.grnNo = data.grnNo || '';
    this.date = data.date || null;
    this.supplier = data.supplier || {
      supplierId: '',
      supplierName: '',
      phoneNumber: '',
      place: ''
    };
    this.items = data.items || [];
    this.subtotal = data.subtotal || 0;
    this.total = data.total || 0;
    this.createdBy = data.createdBy || '';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static collection = 'purchases';

  // Validate purchase data
  validate() {
    const errors = [];
    
    console.log('Validating purchase data:', {
      billNo: this.billNo,
      grnNo: this.grnNo,
      date: this.date,
      itemsCount: this.items?.length,
      subtotal: this.subtotal,
      total: this.total,
      createdBy: this.createdBy
    });
    
    if (!this.billNo || this.billNo.trim() === '') {
      errors.push('Bill number is required');
    }
    
    if (!this.grnNo || this.grnNo.trim() === '') {
      errors.push('GRN number is required');
    }
    
    if (!this.date) {
      errors.push('Date is required');
    }
    
    if (!this.items || this.items.length === 0) {
      errors.push('At least one item is required');
    }
    
    if (this.subtotal <= 0) {
      errors.push('Subtotal must be greater than 0');
    }
    
    if (this.total <= 0) {
      errors.push('Total must be greater than 0');
    }
    
    if (!this.createdBy || this.createdBy.trim() === '') {
      errors.push('Created by is required');
    }
    
    if (errors.length > 0) {
      console.error('Purchase validation failed:', errors);
    }
    
    return errors;
  }

  // Save purchase to Firestore
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const purchaseData = {
      billNo: this.billNo.trim(),
      grnNo: this.grnNo.trim(),
      date: this.date,
      supplier: this.supplier,
      items: this.items,
      subtotal: parseFloat(this.subtotal),
      total: parseFloat(this.total),
      createdBy: this.createdBy
    };

    if (this.id) {
      // Update existing purchase
      const updated = await firebaseService.update(Purchase.collection, this.id, purchaseData);
      return new Purchase(updated);
    } else {
      // Create new purchase
      const created = await firebaseService.create(Purchase.collection, purchaseData);
      return new Purchase(created);
    }
  }

  // Static methods
  static async findById(id) {
    const purchaseData = await firebaseService.findById(Purchase.collection, id);
    return purchaseData ? new Purchase(purchaseData) : null;
  }

  static async findAll() {
    const purchases = await firebaseService.findAll(Purchase.collection);
    return purchases.map(purchase => new Purchase(purchase));
  }

  static async findOne(filters = []) {
    const purchaseData = await firebaseService.findOne(Purchase.collection, filters);
    return purchaseData ? new Purchase(purchaseData) : null;
  }

  static async findByBillNo(billNo) {
    return await Purchase.findOne([{ field: 'billNo', operator: '==', value: billNo }]);
  }

  static async deleteById(id) {
    return await firebaseService.delete(Purchase.collection, id);
  }

  // Instance methods
  toJSON() {
    return {
      id: this.id,
      billNo: this.billNo,
      grnNo: this.grnNo,
      date: this.date,
      supplier: this.supplier,
      items: this.items,
      subtotal: this.subtotal,
      total: this.total,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Purchase;