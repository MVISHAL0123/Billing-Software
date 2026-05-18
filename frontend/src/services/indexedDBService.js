/**
 * IndexedDB Service for Offline-First Billing Application
 * Handles all local data storage operations
 */

const DB_NAME = 'BillingSystemDB';
const DB_VERSION = 1;

const STORES = {
  USERS: 'users',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  BILLS: 'bills',
  PURCHASES: 'purchases',
  BACKUPS: 'backups'
};

class IndexedDBService {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  /**
   * Initialize IndexedDB database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ IndexedDB init failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        this.requestPersistentStorage();
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains(STORES.USERS)) {
          const userStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
          userStore.createIndex('username', 'username', { unique: true });
        }

        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
          productStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
          const customerStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' });
          customerStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.SUPPLIERS)) {
          const supplierStore = db.createObjectStore(STORES.SUPPLIERS, { keyPath: 'id' });
          supplierStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.BILLS)) {
          const billStore = db.createObjectStore(STORES.BILLS, { keyPath: 'id' });
          billStore.createIndex('billNumber', 'billNumber', { unique: true });
          billStore.createIndex('date', 'date', { unique: false });
          billStore.createIndex('customerId', 'customerId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.PURCHASES)) {
          const purchaseStore = db.createObjectStore(STORES.PURCHASES, { keyPath: 'id' });
          purchaseStore.createIndex('grnNumber', 'grnNumber', { unique: true });
          purchaseStore.createIndex('date', 'date', { unique: false });
          purchaseStore.createIndex('supplierId', 'supplierId', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.BACKUPS)) {
          db.createObjectStore(STORES.BACKUPS, { keyPath: 'id', autoIncrement: true });
        }

        console.log('✅ Object stores created');
      };
    });
  }

  /**
   * Request persistent storage (unlimited quota)
   */
  async requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      try {
        const persistent = await navigator.storage.persist();
        if (persistent) {
          console.log('✅ Persistent storage granted - unlimited quota available');
        } else {
          console.log('⚠️  Persistent storage not granted - 50MB limit applies');
        }
      } catch (error) {
        console.log('⚠️  Could not request persistent storage:', error.message);
      }
    }
  }

  /**
   * Get storage quota
   */
  async getStorageQuota() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const percentUsed = (estimate.usage / estimate.quota) * 100;
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          percentUsed: Math.round(percentUsed),
          available: estimate.quota - estimate.usage
        };
      } catch (error) {
        console.error('Error getting storage quota:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Add or update a record
   */
  async add(storeName, data) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = data.id ? store.put(data) : store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a record by ID
   */
  async get(storeName, id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all records from a store
   */
  async getAll(storeName) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a record
   */
  async delete(storeName, id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all records from a store
   */
  async clear(storeName) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query by index
   */
  async queryByIndex(storeName, indexName, value) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    return this.getAll(STORES.USERS);
  }

  /**
   * Find user by username
   */
  async findUserByUsername(username) {
    const users = await this.queryByIndex(STORES.USERS, 'username', username);
    return users[0] || null;
  }

  /**
   * Add or update user
   */
  async addUser(userData) {
    return this.add(STORES.USERS, userData);
  }

  /**
   * Get all products
   */
  async getAllProducts() {
    return this.getAll(STORES.PRODUCTS);
  }

  /**
   * Add or update product
   */
  async addProduct(productData) {
    return this.add(STORES.PRODUCTS, productData);
  }

  /**
   * Delete product
   */
  async deleteProduct(id) {
    return this.delete(STORES.PRODUCTS, id);
  }

  /**
   * Get all customers
   */
  async getAllCustomers() {
    return this.getAll(STORES.CUSTOMERS);
  }

  /**
   * Add or update customer
   */
  async addCustomer(customerData) {
    return this.add(STORES.CUSTOMERS, customerData);
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id) {
    return this.delete(STORES.CUSTOMERS, id);
  }

  /**
   * Get all suppliers
   */
  async getAllSuppliers() {
    return this.getAll(STORES.SUPPLIERS);
  }

  /**
   * Add or update supplier
   */
  async addSupplier(supplierData) {
    return this.add(STORES.SUPPLIERS, supplierData);
  }

  /**
   * Delete supplier
   */
  async deleteSupplier(id) {
    return this.delete(STORES.SUPPLIERS, id);
  }

  /**
   * Get all bills
   */
  async getAllBills() {
    return this.getAll(STORES.BILLS);
  }

  /**
   * Add or update bill
   */
  async addBill(billData) {
    return this.add(STORES.BILLS, billData);
  }

  /**
   * Delete bill
   */
  async deleteBill(id) {
    return this.delete(STORES.BILLS, id);
  }

  /**
   * Get all purchases
   */
  async getAllPurchases() {
    return this.getAll(STORES.PURCHASES);
  }

  /**
   * Add or update purchase
   */
  async addPurchase(purchaseData) {
    return this.add(STORES.PURCHASES, purchaseData);
  }

  /**
   * Delete purchase
   */
  async deletePurchase(id) {
    return this.delete(STORES.PURCHASES, id);
  }

  /**
   * Export all data as JSON
   */
  async exportAllData() {
    const data = {
      exportDate: new Date().toISOString(),
      users: await this.getAllUsers(),
      products: await this.getAllProducts(),
      customers: await this.getAllCustomers(),
      suppliers: await this.getAllSuppliers(),
      bills: await this.getAllBills(),
      purchases: await this.getAllPurchases()
    };
    return data;
  }

  /**
   * Import data from JSON
   */
  async importData(data) {
    try {
      if (data.users) {
        for (const user of data.users) {
          await this.addUser(user);
        }
      }
      if (data.products) {
        for (const product of data.products) {
          await this.addProduct(product);
        }
      }
      if (data.customers) {
        for (const customer of data.customers) {
          await this.addCustomer(customer);
        }
      }
      if (data.suppliers) {
        for (const supplier of data.suppliers) {
          await this.addSupplier(supplier);
        }
      }
      if (data.bills) {
        for (const bill of data.bills) {
          await this.addBill(bill);
        }
      }
      if (data.purchases) {
        for (const purchase of data.purchases) {
          await this.addPurchase(purchase);
        }
      }
      return { success: true, message: 'Data imported successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save backup metadata
   */
  async saveBackupMetadata(metadata) {
    return this.add(STORES.BACKUPS, metadata);
  }

  /**
   * Get backup history
   */
  async getBackupHistory() {
    return this.getAll(STORES.BACKUPS);
  }
}

export const indexedDBService = new IndexedDBService();
