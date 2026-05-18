/**
 * Firebase to IndexedDB Migration Service
 * Exports data from Firestore and imports to local IndexedDB
 */

import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { indexedDBService } from './indexedDBService';

class FirebaseMigrationService {
  /**
   * Export all data from Firestore
   */
  async exportFromFirestore() {
    try {
      console.log('📤 Starting Firestore data export...');
      
      if (!db) {
        throw new Error('Firebase not initialized - cannot export data');
      }

      const collections = ['users', 'products', 'customers', 'suppliers', 'bills', 'purchases'];
      const exportedData = {};

      for (const collectionName of collections) {
        try {
          console.log(`📋 Exporting ${collectionName}...`);
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          
          exportedData[collectionName] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log(`✅ Exported ${exportedData[collectionName].length} ${collectionName}`);
        } catch (error) {
          console.warn(`⚠️ Failed to export ${collectionName}:`, error.message);
          exportedData[collectionName] = [];
        }
      }

      console.log('✅ Firestore export complete:', exportedData);
      return {
        success: true,
        data: exportedData,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Firestore export failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import exported data to IndexedDB
   */
  async importToIndexedDB(data) {
    try {
      console.log('📥 Starting import to IndexedDB...');
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }

      let totalImported = 0;

      // Import each collection
      if (data.users && Array.isArray(data.users)) {
        for (const user of data.users) {
          try {
            // Skip if user already exists to avoid duplicates
            const existing = await indexedDBService.findUserByUsername(user.username);
            if (!existing) {
              await indexedDBService.addUser(user);
              totalImported++;
            }
          } catch (error) {
            console.warn('⚠️ Failed to import user:', error.message);
          }
        }
        console.log(`✅ Imported ${data.users.length} users`);
      }

      if (data.products && Array.isArray(data.products)) {
        for (const product of data.products) {
          try {
            await indexedDBService.addProduct(product);
            totalImported++;
          } catch (error) {
            console.warn('⚠️ Failed to import product:', error.message);
          }
        }
        console.log(`✅ Imported ${data.products.length} products`);
      }

      if (data.customers && Array.isArray(data.customers)) {
        for (const customer of data.customers) {
          try {
            await indexedDBService.addCustomer(customer);
            totalImported++;
          } catch (error) {
            console.warn('⚠️ Failed to import customer:', error.message);
          }
        }
        console.log(`✅ Imported ${data.customers.length} customers`);
      }

      if (data.suppliers && Array.isArray(data.suppliers)) {
        for (const supplier of data.suppliers) {
          try {
            await indexedDBService.addSupplier(supplier);
            totalImported++;
          } catch (error) {
            console.warn('⚠️ Failed to import supplier:', error.message);
          }
        }
        console.log(`✅ Imported ${data.suppliers.length} suppliers`);
      }

      if (data.bills && Array.isArray(data.bills)) {
        for (const bill of data.bills) {
          try {
            await indexedDBService.addBill(bill);
            totalImported++;
          } catch (error) {
            console.warn('⚠️ Failed to import bill:', error.message);
          }
        }
        console.log(`✅ Imported ${data.bills.length} bills`);
      }

      if (data.purchases && Array.isArray(data.purchases)) {
        for (const purchase of data.purchases) {
          try {
            await indexedDBService.addPurchase(purchase);
            totalImported++;
          } catch (error) {
            console.warn('⚠️ Failed to import purchase:', error.message);
          }
        }
        console.log(`✅ Imported ${data.purchases.length} purchases`);
      }

      console.log('✅ Import to IndexedDB complete');
      return {
        success: true,
        totalImported: totalImported,
        message: `Successfully imported ${totalImported} records to IndexedDB`
      };
    } catch (error) {
      console.error('❌ Import to IndexedDB failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * One-step migration: Export from Firestore and Import to IndexedDB
   */
  async migrateFromFirestoreToIndexedDB() {
    try {
      console.log('🔄 Starting Firestore → IndexedDB migration...');

      // Step 1: Export from Firestore
      const exportResult = await this.exportFromFirestore();
      if (!exportResult.success) {
        throw new Error(`Export failed: ${exportResult.error}`);
      }

      // Step 2: Import to IndexedDB
      const importResult = await this.importToIndexedDB(exportResult.data);
      if (!importResult.success) {
        throw new Error(`Import failed: ${importResult.error}`);
      }

      console.log('✅ Migration complete!');
      return {
        success: true,
        message: 'Data successfully migrated from Firestore to IndexedDB',
        stats: exportResult.data
      };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download exported data as JSON file
   */
  async downloadFirestoreDataAsJSON() {
    try {
      const exportResult = await this.exportFromFirestore();
      if (!exportResult.success) {
        throw new Error(exportResult.error);
      }

      const json = JSON.stringify({
        ...exportResult.data,
        exportDate: exportResult.exportDate
      }, null, 2);

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `firestore-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      return {
        success: true,
        message: 'Data downloaded successfully'
      };
    } catch (error) {
      console.error('❌ Download failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const firebaseMigrationService = new FirebaseMigrationService();
