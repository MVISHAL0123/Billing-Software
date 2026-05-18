/**
 * Firebase Cloud Storage Backup Service
 * Auto-backup IndexedDB data to Firebase Cloud Storage
 */

import { getStorage, ref, uploadString, listAll, getBytes } from 'firebase/storage';
import { indexedDBService } from './indexedDBService';

class FirebaseBackupService {
  constructor() {
    this.storage = null; // Initialize lazily
    this.backupFolder = 'billing-backups';
    this.autoBackupInterval = null;
  }

  /**
   * Initialize storage lazily when first needed
   */
  getStorageInstance() {
    if (!this.storage) {
      try {
        this.storage = getStorage();
      } catch (error) {
        console.warn('⚠️ Firebase Cloud Storage not available - backups disabled:', error.message);
        return null;
      }
    }
    return this.storage;
  }

  /**
   * Create backup filename with timestamp
   */
  getBackupFilename() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    return `backup_${dateStr}_${timeStr}.json`;
  }

  /**
   * Upload backup to Firebase Cloud Storage
   */
  async uploadBackup() {
    try {
      const storage = this.getStorageInstance();
      if (!storage) {
        console.log('⏭️ Firebase Cloud Storage unavailable - skipping backup');
        return { success: false, message: 'Backup storage unavailable' };
      }

      console.log('📤 Starting backup upload...');
      
      // Export all data
      const allData = await indexedDBService.exportAllData();
      const jsonString = JSON.stringify(allData, null, 2);

      // Upload to Firebase Storage
      const filename = this.getBackupFilename();
      const storageRef = ref(storage, `${this.backupFolder}/${filename}`);
      
      await uploadString(storageRef, jsonString);

      // Save backup metadata
      const metadata = {
        id: Date.now(),
        filename: filename,
        uploadDate: new Date().toISOString(),
        dataSize: jsonString.length,
        recordCounts: {
          bills: allData.bills.length,
          products: allData.products.length,
          customers: allData.customers.length,
          suppliers: allData.suppliers.length,
          purchases: allData.purchases.length,
          users: allData.users.length
        }
      };

      await indexedDBService.saveBackupMetadata(metadata);

      console.log('✅ Backup uploaded successfully:', filename);
      return { success: true, filename, metadata };
    } catch (error) {
      console.error('❌ Backup upload failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download backup from Firebase Cloud Storage
   */
  async downloadBackup(filename) {
    try {
      const storage = this.getStorageInstance();
      if (!storage) {
        throw new Error('Firebase Cloud Storage unavailable');
      }

      console.log('📥 Downloading backup:', filename);
      
      const storageRef = ref(storage, `${this.backupFolder}/${filename}`);
      const bytes = await getBytes(storageRef);
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(bytes);
      const data = JSON.parse(jsonString);

      console.log('✅ Backup downloaded successfully');
      return { success: true, data };
    } catch (error) {
      console.error('❌ Backup download failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get list of all backups
   */
  async getBackupList() {
    try {
      const storage = this.getStorageInstance();
      if (!storage) return { success: true, backups: [] };

      console.log('📋 Fetching backup list...');
      
      const folderRef = ref(storage, this.backupFolder);
      const result = await listAll(folderRef);

      const backups = result.items.map(item => {
        // Parse filename to extract date
        const match = item.name.match(/backup_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/);
        return {
          name: item.name,
          fullPath: item.fullPath,
          date: match ? `${match[1]} ${match[2].replace(/-/g, ':')}` : item.name
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log('✅ Backup list fetched:', backups.length, 'backups');
      return { success: true, backups };
    } catch (error) {
      console.error('❌ Failed to fetch backup list:', error);
      return { success: false, error: error.message, backups: [] };
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(filename) {
    try {
      console.log('🔄 Restoring from backup:', filename);
      
      const result = await this.downloadBackup(filename);
      if (!result.success) {
        return result;
      }

      // Import data
      const importResult = await indexedDBService.importData(result.data);
      
      if (importResult.success) {
        console.log('✅ Backup restored successfully');
        return { success: true, message: 'Backup restored successfully' };
      } else {
        return { success: false, error: importResult.error };
      }
    } catch (error) {
      console.error('❌ Restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start auto-backup (runs daily)
   */
  startAutoBackup() {
    if (this.autoBackupInterval) {
      console.log('⚠️  Auto-backup already running');
      return;
    }

    // Run backup immediately
    this.uploadBackup();

    // Then run every 24 hours
    this.autoBackupInterval = setInterval(async () => {
      console.log('🔄 Auto-backup triggered (daily)');
      await this.uploadBackup();
    }, 24 * 60 * 60 * 1000);

    console.log('✅ Auto-backup started - will run daily');
  }

  /**
   * Stop auto-backup
   */
  stopAutoBackup() {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
      this.autoBackupInterval = null;
      console.log('⛔ Auto-backup stopped');
    }
  }

  /**
   * Delete old backups (keep only last 30 days)
   */
  async cleanupOldBackups() {
    try {
      console.log('🧹 Cleaning up old backups...');
      
      const result = await this.getBackupList();
      if (!result.success) {
        return result;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Note: Actual deletion requires Firebase Admin SDK
      // For now, just log which backups are old
      const oldBackups = result.backups.filter(backup => {
        const backupDate = new Date(backup.date);
        return backupDate < thirtyDaysAgo;
      });

      console.log('ℹ️  Old backups (30+ days):', oldBackups.length);
      console.log('💡 Tip: Manual deletion can be done via Firebase Console');
      
      return { success: true, oldBackupCount: oldBackups.length };
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export const firebaseBackupService = new FirebaseBackupService();
