/**
 * Firestore Service Wrapper - Redirects to IndexedDB
 * This wrapper maintains backward compatibility while using IndexedDB
 * All data is now stored locally - 100% offline
 */

import { indexedDBService } from './indexedDBService';

console.log('✅ Firestore Service Wrapper Initialized - Using IndexedDB (Offline)');

export const firestoreService = {
  // Bills
  getBills: async () => {
    return await indexedDBService.getAllBills();
  },

  addBill: async (billData) => {
    return await indexedDBService.addBill(billData);
  },

  updateBill: async (id, data) => {
    return await indexedDBService.addBill({ ...data, id });
  },

  deleteBill: async (id) => {
    return await indexedDBService.deleteBill(id);
  },

  // Products
  getProducts: async () => {
    return await indexedDBService.getAllProducts();
  },

  addProduct: async (productData) => {
    return await indexedDBService.addProduct(productData);
  },

  updateProduct: async (id, data) => {
    return await indexedDBService.addProduct({ ...data, id });
  },

  deleteProduct: async (id) => {
    return await indexedDBService.deleteProduct(id);
  },

  // Customers
  getCustomers: async () => {
    return await indexedDBService.getAllCustomers();
  },

  addCustomer: async (customerData) => {
    return await indexedDBService.addCustomer(customerData);
  },

  updateCustomer: async (id, data) => {
    return await indexedDBService.addCustomer({ ...data, id });
  },

  deleteCustomer: async (id) => {
    return await indexedDBService.deleteCustomer(id);
  },

  // Suppliers
  getSuppliers: async () => {
    return await indexedDBService.getAllSuppliers();
  },

  addSupplier: async (supplierData) => {
    return await indexedDBService.addSupplier(supplierData);
  },

  updateSupplier: async (id, data) => {
    return await indexedDBService.addSupplier({ ...data, id });
  },

  deleteSupplier: async (id) => {
    return await indexedDBService.deleteSupplier(id);
  },

  // Purchases
  getPurchases: async () => {
    return await indexedDBService.getAllPurchases();
  },

  addPurchase: async (purchaseData) => {
    return await indexedDBService.addPurchase(purchaseData);
  },

  updatePurchase: async (id, data) => {
    return await indexedDBService.addPurchase({ ...data, id });
  },

  deletePurchase: async (id) => {
    return await indexedDBService.deletePurchase(id);
  },

  // Generic collection access
  getCollection: async (collectionName) => {
    switch (collectionName.toLowerCase()) {
      case 'bills':
        return await indexedDBService.getAllBills();
      case 'products':
        return await indexedDBService.getAllProducts();
      case 'customers':
        return await indexedDBService.getAllCustomers();
      case 'suppliers':
        return await indexedDBService.getAllSuppliers();
      case 'purchases':
        return await indexedDBService.getAllPurchases();
      default:
        return [];
    }
  }
};
