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

console.log('✅ Firestore Service Initialized - Using Direct Firestore API');

export const firestoreService = {
  // Products
  getProducts: async () => {
    try {
      console.log('📦 Firestore: Fetching products collection...');
      const snapshot = await getDocs(collection(db, 'products'));
      console.log(`📦 Found ${snapshot.docs.length} products in Firestore`);
      
      const products = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log(`  ✓ Product: "${data.productName}" (Stock: ${data.currentStock})`);
        return data;
      });
      
      console.log(`✅ Total products: ${products.length}`);
      return products;
    } catch (error) {
      console.error('❌ Error fetching products:', error.code, error.message);
      return [];
    }
  },

  addProduct: async (product) => {
    try {
      console.log('📝 Adding product to Firestore:', product.productName);
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log('✅ Product added with ID:', docRef.id);
      return { success: true, id: docRef.id, ...product };
    } catch (error) {
      console.error('❌ Error adding product:', error.code, error.message);
      return { success: false, message: error.message };
    }
  },

  updateProduct: async (productId, updates) => {
    try {
      console.log('✏️  Updating product:', productId);
      const docRef = doc(db, 'products', productId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
      console.log('✅ Product updated');
      return { success: true, ...updates };
    } catch (error) {
      console.error('❌ Error updating product:', error.message);
      return { success: false, message: error.message };
    }
  },

  deleteProduct: async (productId) => {
    try {
      console.log('🗑️  Deleting product:', productId);
      await deleteDoc(doc(db, 'products', productId));
      console.log('✅ Product deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting product:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Customers
  getCustomers: async () => {
    try {
      console.log('👥 Firestore: Fetching customers collection...');
      const snapshot = await getDocs(collection(db, 'customers'));
      console.log(`👥 Found ${snapshot.docs.length} customers in Firestore`);
      
      const customers = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log(`  ✓ Customer: "${data.customerName}" (Phone: ${data.phoneNumber})`);
        return data;
      });
      
      console.log(`✅ Total customers: ${customers.length}`);
      return customers;
    } catch (error) {
      console.error('❌ Error fetching customers:', error.message);
      return [];
    }
  },

  addCustomer: async (customer) => {
    try {
      console.log('📝 Adding customer to Firestore:', customer.customerName);
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customer,
        createdAt: Timestamp.now()
      });
      console.log('✅ Customer added with ID:', docRef.id);
      return { success: true, id: docRef.id, ...customer };
    } catch (error) {
      console.error('❌ Error adding customer:', error.message);
      return { success: false, message: error.message };
    }
  },

  updateCustomer: async (customerId, updates) => {
    try {
      console.log('✏️  Updating customer:', customerId);
      const docRef = doc(db, 'customers', customerId);
      await updateDoc(docRef, updates);
      console.log('✅ Customer updated');
      return { success: true, ...updates };
    } catch (error) {
      console.error('❌ Error updating customer:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Suppliers
  getSuppliers: async () => {
    try {
      console.log('🏢 Firestore: Fetching suppliers collection...');
      const snapshot = await getDocs(collection(db, 'suppliers'));
      console.log(`🏢 Found ${snapshot.docs.length} suppliers in Firestore`);
      
      const suppliers = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log(`  ✓ Supplier: "${data.supplierName}" (Phone: ${data.phoneNumber})`);
        return data;
      });
      
      console.log(`✅ Total suppliers: ${suppliers.length}`);
      return suppliers;
    } catch (error) {
      console.error('❌ Error fetching suppliers:', error.message);
      return [];
    }
  },

  addSupplier: async (supplier) => {
    try {
      console.log('📝 Adding supplier to Firestore:', supplier.supplierName);
      const docRef = await addDoc(collection(db, 'suppliers'), {
        ...supplier,
        createdAt: Timestamp.now()
      });
      console.log('✅ Supplier added with ID:', docRef.id);
      return { success: true, id: docRef.id, ...supplier };
    } catch (error) {
      console.error('❌ Error adding supplier:', error.message);
      return { success: false, message: error.message };
    }
  },

  updateSupplier: async (supplierId, updates) => {
    try {
      console.log('✏️  Updating supplier:', supplierId);
      const docRef = doc(db, 'suppliers', supplierId);
      await updateDoc(docRef, updates);
      console.log('✅ Supplier updated');
      return { success: true, ...updates };
    } catch (error) {
      console.error('❌ Error updating supplier:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Bills/Sales
  getBills: async () => {
    try {
      console.log('💰 Firestore: Fetching bills collection...');
      const snapshot = await getDocs(collection(db, 'bills'));
      console.log(`💰 Found ${snapshot.docs.length} bills in Firestore`);
      
      const bills = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log(`  ✓ Bill: #${data.billNo} - Total: ₹${data.total}`);
        return data;
      });
      
      console.log(`✅ Total bills: ${bills.length}`);
      return bills;
    } catch (error) {
      console.error('❌ Error fetching bills:', error.message);
      return [];
    }
  },

  addBill: async (bill) => {
    try {
      console.log('📝 Adding bill to Firestore:', bill.billNo);
      const docRef = await addDoc(collection(db, 'bills'), {
        ...bill,
        createdAt: Timestamp.now()
      });
      console.log('✅ Bill added with ID:', docRef.id);
      return { success: true, id: docRef.id, ...bill };
    } catch (error) {
      console.error('❌ Error adding bill:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Purchases
  getPurchases: async () => {
    try {
      console.log('📦 Firestore: Fetching purchases collection...');
      const snapshot = await getDocs(collection(db, 'purchases'));
      console.log(`📦 Found ${snapshot.docs.length} purchases in Firestore`);
      
      const purchases = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log(`  ✓ Purchase: GRN-#${data.grnNo} - Total: ₹${data.total}`);
        return data;
      });
      
      console.log(`✅ Total purchases: ${purchases.length}`);
      return purchases;
    } catch (error) {
      console.error('❌ Error fetching purchases:', error.message);
      return [];
    }
  },

  addPurchase: async (purchase) => {
    try {
      console.log('📝 Adding purchase to Firestore:', purchase.grnNo);
      const docRef = await addDoc(collection(db, 'purchases'), {
        ...purchase,
        createdAt: Timestamp.now()
      });
      console.log('✅ Purchase added with ID:', docRef.id);
      return { success: true, id: docRef.id, ...purchase };
    } catch (error) {
      console.error('❌ Error adding purchase:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Generic operations
  addDocument: async (collectionName, data) => {
    try {
      console.log(`📝 Adding document to ${collectionName}:`, data);
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now()
      });
      console.log(`✅ Document added to ${collectionName} with ID:`, docRef.id);
      return { success: true, id: docRef.id, ...data };
    } catch (error) {
      console.error(`❌ Error adding document to ${collectionName}:`, error.message);
      return { success: false, message: error.message };
    }
  },

  getCollection: async (collectionName) => {
    try {
      console.log(`📋 Firestore: Fetching ${collectionName} collection...`);
      const snapshot = await getDocs(collection(db, collectionName));
      console.log(`📋 Found ${snapshot.docs.length} documents in ${collectionName}`);
      
      const docs = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        console.log(`  ✓ Doc: ${doc.id}`);
        return data;
      });
      
      console.log(`✅ Total ${collectionName}: ${docs.length}`);
      return docs;
    } catch (error) {
      console.error(`❌ Error fetching ${collectionName}:`, error.message);
      return [];
    }
  }
};
