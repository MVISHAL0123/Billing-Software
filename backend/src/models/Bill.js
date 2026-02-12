import firebaseService from '../services/firebaseService.js';

class Bill {
  constructor(data = {}) {
    this.id = data.id || null;
    this.billNo = data.billNo || '';
    this.date = data.date || null;
    this.customer = data.customer || {
      customerId: '',
      customerName: '',
      phoneNumber: '',
      place: ''
    };
    this.items = data.items || [];
    this.subtotal = data.subtotal || 0;
    this.total = data.total || 0;
    this.totalProfit = data.totalProfit || 0;
    this.marginPercentage = data.marginPercentage || 0;
    this.createdBy = data.createdBy || '';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static collection = 'bills';

  // Validate bill data
  validate() {
    const errors = [];
    
    if (!this.billNo || this.billNo.trim() === '') {
      errors.push('Bill number is required');
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
    
    return errors;
  }

  // Save bill to Firestore
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const billData = {
      billNo: this.billNo.trim(),
      date: this.date,
      customer: this.customer,
      items: this.items,
      subtotal: parseFloat(this.subtotal),
      total: parseFloat(this.total),
      totalProfit: parseFloat(this.totalProfit),
      marginPercentage: parseFloat(this.marginPercentage),
      createdBy: this.createdBy
    };

    if (this.id) {
      // Update existing bill
      const updated = await firebaseService.update(Bill.collection, this.id, billData);
      return new Bill(updated);
    } else {
      // Create new bill
      const created = await firebaseService.create(Bill.collection, billData);
      return new Bill(created);
    }
  }

  // Static methods
  static async findById(id) {
    const billData = await firebaseService.findById(Bill.collection, id);
    return billData ? new Bill(billData) : null;
  }

  static async findAll() {
    const bills = await firebaseService.findAll(Bill.collection);
    return bills.map(bill => new Bill(bill));
  }

  static async findOne(filters = []) {
    const billData = await firebaseService.findOne(Bill.collection, filters);
    return billData ? new Bill(billData) : null;
  }

  static async findByBillNo(billNo) {
    return await Bill.findOne([{ field: 'billNo', operator: '==', value: billNo }]);
  }

  static async deleteById(id) {
    return await firebaseService.delete(Bill.collection, id);
  }

  static async deleteAllBills() {
    return await firebaseService.batchDelete(Bill.collection, { field: 'billNo', operator: '!=', value: '' });
  }

  // Instance methods
  toJSON() {
    return {
      id: this.id,
      billNo: this.billNo,
      date: this.date,
      customer: this.customer,
      items: this.items,
      subtotal: this.subtotal,
      total: this.total,
      totalProfit: this.totalProfit,
      marginPercentage: this.marginPercentage,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Bill;
