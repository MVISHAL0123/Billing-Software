import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  Timestamp
} from 'firebase/firestore';

export const firestoreService = {
  // Products
  getProducts: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  addProduct: async (product) => {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return { success: true, id: docRef.id, ...product };
    } catch (error) {
      console.error('Error adding product:', error);
      return { success: false, message: error.message };
    }
  },

  updateProduct: async (productId, updates) => {
    try {
      const docRef = doc(db, 'products', productId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      return { success: true, ...updates };
    } catch (error) {
      console.error('Error updating product:', error);
      return { success: false, message: error.message };
    }
  },

  deleteProduct: async (productId) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      return { success: false, message: error.message };
    }
  },

  // Customers
  getCustomers: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'customers'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  },

  addCustomer: async (customer) => {
    try {
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customer,
        createdAt: Timestamp.now()
      });
      return { success: true, id: docRef.id, ...customer };
    } catch (error) {
      console.error('Error adding customer:', error);
      return { success: false, message: error.message };
    }
  },

  updateCustomer: async (customerId, updates) => {
    try {
      const docRef = doc(db, 'customers', customerId);
      await updateDoc(docRef, updates);
      return { success: true, ...updates };
    } catch (error) {
      console.error('Error updating customer:', error);
      return { success: false, message: error.message };
    }
  },

  // Bills/Sales
  getBills: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'bills'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching bills:', error);
      return [];
    }
  },

  addBill: async (bill) => {
    try {
      const docRef = await addDoc(collection(db, 'bills'), {
        ...bill,
        createdAt: Timestamp.now()
      });
      return { success: true, id: docRef.id, ...bill };
    } catch (error) {
      console.error('Error adding bill:', error);
      return { success: false, message: error.message };
    }
  },

  // Purchases
  getPurchases: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'purchases'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching purchases:', error);
      return [];
    }
  },

  addPurchase: async (purchase) => {
    try {
      const docRef = await addDoc(collection(db, 'purchases'), {
        ...purchase,
        createdAt: Timestamp.now()
      });
      return { success: true, id: docRef.id, ...purchase };
    } catch (error) {
      console.error('Error adding purchase:', error);
      return { success: false, message: error.message };
    }
  },

  // Generic operations
  addDocument: async (collectionName, data) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now()
      });
      return { success: true, id: docRef.id, ...data };
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      return { success: false, message: error.message };
    }
  },

  getCollection: async (collectionName) => {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      return [];
    }
  }
};
