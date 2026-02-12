import firebaseService from '../services/firebaseService.js';

class Supplier {
  constructor(data = {}) {
    this.id = data.id || null;
    this.supplierName = data.supplierName || '';
    this.place = data.place || '';
    this.phoneNumber = data.phoneNumber || '';
    this.createdBy = data.createdBy || '';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static collection = 'suppliers';

  // Validate supplier data
  validate() {
    const errors = [];
    
    if (!this.supplierName || this.supplierName.trim() === '') {
      errors.push('Supplier name is required');
    }
    
    if (!this.place || this.place.trim() === '') {
      errors.push('Place is required');
    }
    
    if (!this.phoneNumber || this.phoneNumber.trim() === '') {
      errors.push('Phone number is required');
    }
    
    if (!this.createdBy || this.createdBy.trim() === '') {
      errors.push('Created by is required');
    }
    
    return errors;
  }

  // Save supplier to Firestore
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const supplierData = {
      supplierName: this.supplierName.trim(),
      place: this.place.trim(),
      phoneNumber: this.phoneNumber.trim(),
      createdBy: this.createdBy
    };

    if (this.id) {
      // Update existing supplier
      const updated = await firebaseService.update(Supplier.collection, this.id, supplierData);
      return new Supplier(updated);
    } else {
      // Create new supplier
      const created = await firebaseService.create(Supplier.collection, supplierData);
      return new Supplier(created);
    }
  }

  // Static methods
  static async findById(id) {
    const supplierData = await firebaseService.findById(Supplier.collection, id);
    return supplierData ? new Supplier(supplierData) : null;
  }

  static async findAll() {
    const suppliers = await firebaseService.findAll(Supplier.collection);
    return suppliers.map(supplier => new Supplier(supplier));
  }

  static async findOne(filters = []) {
    const supplierData = await firebaseService.findOne(Supplier.collection, filters);
    return supplierData ? new Supplier(supplierData) : null;
  }

  static async findByPhoneNumber(phoneNumber) {
    return await Supplier.findOne([{ field: 'phoneNumber', operator: '==', value: phoneNumber }]);
  }

  static async deleteById(id) {
    return await firebaseService.delete(Supplier.collection, id);
  }

  // Instance methods
  toJSON() {
    return {
      id: this.id,
      supplierName: this.supplierName,
      place: this.place,
      phoneNumber: this.phoneNumber,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Supplier;