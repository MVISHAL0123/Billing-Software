import { getFirestore } from '../../config/database.js';
import admin from 'firebase-admin';

class FirebaseService {
  constructor() {
    this.db = getFirestore();
  }

  // Check if Firebase is connected
  isConnected() {
    return this.db !== null && this.db !== undefined;
  }

  // Generic CRUD operations
  async create(collection, data) {
    if (!this.isConnected()) {
      throw new Error('Firebase not connected. Please configure your Firebase credentials.');
    }
    
    const docRef = this.db.collection(collection).doc();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    const documentData = {
      ...data,
      id: docRef.id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await docRef.set(documentData);
    
    // Return the document with the generated ID
    return { id: docRef.id, ...data };
  }

  async findById(collection, id) {
    if (!this.isConnected()) {
      throw new Error('Firebase not connected. Please configure your Firebase credentials.');
    }
    
    const doc = await this.db.collection(collection).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return { id: doc.id, ...doc.data() };
  }

  async findAll(collection, filters = []) {
    if (!this.isConnected()) {
      throw new Error('Firebase not connected. Please configure your Firebase credentials.');
    }
    
    let query = this.db.collection(collection);
    
    // Apply filters
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async update(collection, id, data) {
    if (!this.isConnected()) {
      throw new Error('Firebase not connected. Please configure your Firebase credentials.');
    }
    
    const docRef = this.db.collection(collection).doc(id);
    const updateData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await docRef.update(updateData);
    return { id, ...data };
  }

  async delete(collection, id) {
    if (!this.isConnected()) {
      throw new Error('Firebase not connected. Please configure your Firebase credentials.');
    }
    
    await this.db.collection(collection).doc(id).delete();
    return true;
  }

  async findOne(collection, filters = []) {
    let query = this.db.collection(collection);
    
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });
    
    const snapshot = await query.limit(1).get();
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // Batch operations
  async batchDelete(collection, condition) {
    const snapshot = await this.db.collection(collection).where(condition.field, condition.operator, condition.value).get();
    const batch = this.db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return snapshot.size;
  }

  // Get next bill number WITHOUT incrementing (for preview/display)
  async getNextBillNumber() {
    const counterRef = this.db.collection('counters').doc('billNumber');
    const counterDoc = await counterRef.get();
    
    if (!counterDoc.exists) {
      // Initialize counter by checking existing bills
      const billsSnapshot = await this.db.collection('bills').get();
      const maxBillNo = billsSnapshot.docs.reduce((max, doc) => {
        const billNo = parseInt(doc.data().billNo);
        return !isNaN(billNo) && billNo > max ? billNo : max;
      }, 0);
      
      // Set counter but return next number
      await counterRef.set({ value: maxBillNo });
      return maxBillNo + 1;
    }
    
    const currentValue = counterDoc.data().value;
    return currentValue + 1;
  }

  // Reserve and increment bill number (called when actually saving a bill)
  async reserveBillNumber() {
    const counterRef = this.db.collection('counters').doc('billNumber');
    
    return this.db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let currentValue = 0;
      
      if (!counterDoc.exists) {
        // Initialize counter by checking existing bills
        const billsSnapshot = await this.db.collection('bills').get();
        const maxBillNo = billsSnapshot.docs.reduce((max, doc) => {
          const billNo = parseInt(doc.data().billNo);
          return !isNaN(billNo) && billNo > max ? billNo : max;
        }, 0);
        
        currentValue = maxBillNo;
        transaction.set(counterRef, { value: currentValue });
      } else {
        currentValue = counterDoc.data().value;
      }
      
      const newValue = currentValue + 1;
      transaction.update(counterRef, { value: newValue });
      
      return newValue;
    });
  }

  // Generate auto-incrementing number for bill numbers (DEPRECATED - use getNextBillNumber instead)
  async generateBillNumber() {
    // For backward compatibility, just return next number without incrementing
    return this.getNextBillNumber();
  }

  // Get next GRN number WITHOUT incrementing (for preview/display)
  async getNextGRNNumber() {
    const counterRef = this.db.collection('counters').doc('grnNumber');
    const counterDoc = await counterRef.get();
    
    if (!counterDoc.exists) {
      // Initialize counter by checking existing purchases
      const purchasesSnapshot = await this.db.collection('purchases').get();
      const maxGRN = purchasesSnapshot.docs.reduce((max, doc) => {
        const grnNo = parseInt(doc.data().grnNo);
        return !isNaN(grnNo) && grnNo > max ? grnNo : max;
      }, 0);
      
      // Set counter but return next number
      await counterRef.set({ value: maxGRN });
      return maxGRN + 1;
    }
    
    const currentValue = counterDoc.data().value;
    return currentValue + 1;
  }

  // Reserve and increment GRN number (called when actually saving a purchase)
  async reserveGRNNumber() {
    const counterRef = this.db.collection('counters').doc('grnNumber');
    
    return this.db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let currentValue = 0;
      
      if (!counterDoc.exists) {
        // Initialize counter by checking existing purchases
        const purchasesSnapshot = await this.db.collection('purchases').get();
        const maxGRN = purchasesSnapshot.docs.reduce((max, doc) => {
          const grnNo = parseInt(doc.data().grnNo);
          return !isNaN(grnNo) && grnNo > max ? grnNo : max;
        }, 0);
        
        currentValue = maxGRN;
        transaction.set(counterRef, { value: currentValue });
      } else {
        currentValue = counterDoc.data().value;
      }
      
      const newValue = currentValue + 1;
      transaction.update(counterRef, { value: newValue });
      
      return newValue;
    });
  }

  // Generate auto-incrementing number for purchase GRN numbers (DEPRECATED - use getNextGRNNumber instead)
  async generateGRNNumber() {
    // For backward compatibility, just return next number without incrementing
    return this.getNextGRNNumber();
  }
}

export default new FirebaseService();