import firebaseService from '../services/firebaseService.js';

class Customer {
  constructor(data = {}) {
    this.id = data.id || null;
    this.customerName = data.customerName || '';
    this.place = data.place || '';
    this.phoneNumber = data.phoneNumber || '';
    this.createdBy = data.createdBy || '';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static collection = 'customers';

  // Validate customer data
  validate() {
    const errors = [];
    
    if (!this.customerName || this.customerName.trim() === '') {
      errors.push('Customer name is required');
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

  // Save customer to Firestore
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const customerData = {
      customerName: this.customerName.trim(),
      place: this.place.trim(),
      phoneNumber: this.phoneNumber.trim(),
      createdBy: this.createdBy
    };

    if (this.id) {
      // Update existing customer
      const updated = await firebaseService.update(Customer.collection, this.id, customerData);
      return new Customer(updated);
    } else {
      // Create new customer
      const created = await firebaseService.create(Customer.collection, customerData);
      return new Customer(created);
    }
  }

  // Static methods
  static async findById(id) {
    const customerData = await firebaseService.findById(Customer.collection, id);
    return customerData ? new Customer(customerData) : null;
  }

  static async findAll() {
    const customers = await firebaseService.findAll(Customer.collection);
    return customers.map(customer => new Customer(customer));
  }

  static async findOne(filters = []) {
    const customerData = await firebaseService.findOne(Customer.collection, filters);
    return customerData ? new Customer(customerData) : null;
  }

  static async findByPhoneNumber(phoneNumber) {
    return await Customer.findOne([{ field: 'phoneNumber', operator: '==', value: phoneNumber }]);
  }

  static async deleteById(id) {
    return await firebaseService.delete(Customer.collection, id);
  }

  // Instance methods
  toJSON() {
    return {
      id: this.id,
      customerName: this.customerName,
      place: this.place,
      phoneNumber: this.phoneNumber,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Customer;
