/**
 * Storage Management Service
 * Handles storage quota monitoring and warnings
 */

export const storageManagementService = {
  /**
   * Get current storage usage
   */
  async getStorageInfo() {
    try {
      if (!navigator.storage || !navigator.storage.estimate) {
        return {
          available: false,
          message: 'Storage API not available'
        };
      }

      const estimate = await navigator.storage.estimate();
      const percentUsed = Math.round((estimate.usage / estimate.quota) * 100);
      const usedMB = Math.round(estimate.usage / (1024 * 1024));
      const totalMB = Math.round(estimate.quota / (1024 * 1024));

      return {
        available: true,
        usage: estimate.usage,
        quota: estimate.quota,
        percentUsed,
        usedMB,
        totalMB,
        status: this.getStorageStatus(percentUsed)
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        available: false,
        error: error.message
      };
    }
  },

  /**
   * Get storage status
   */
  getStorageStatus(percentUsed) {
    if (percentUsed < 50) return 'healthy';
    if (percentUsed < 80) return 'warning';
    return 'critical';
  },

  /**
   * Get storage warning message
   */
  getWarningMessage(percentUsed) {
    if (percentUsed < 50) {
      return null;
    }
    if (percentUsed < 80) {
      return `Storage is ${percentUsed}% full. Please export old data.`;
    }
    return `Storage is critically full (${percentUsed}%). Export data immediately!`;
  },

  /**
   * Request persistent storage (unlimited quota)
   */
  async requestPersistentStorage() {
    try {
      if (!navigator.storage || !navigator.storage.persist) {
        return {
          success: false,
          message: 'Persistent storage not available'
        };
      }

      const persistent = await navigator.storage.persist();
      if (persistent) {
        console.log('✅ Persistent storage permission granted');
        return {
          success: true,
          message: 'Unlimited storage access granted!'
        };
      } else {
        console.log('⚠️  Persistent storage permission denied');
        return {
          success: false,
          message: 'Persistent storage permission denied. Limited to 50MB.'
        };
      }
    } catch (error) {
      console.error('Error requesting persistent storage:', error);
      return {
        success: false,
        message: 'Could not request persistent storage'
      };
    }
  },

  /**
   * Calculate archive recommendations
   */
  async getArchiveRecommendations() {
    try {
      const storageInfo = await this.getStorageInfo();
      if (!storageInfo.available) {
        return null;
      }

      const recommendations = {
        percentUsed: storageInfo.percentUsed,
        availableMB: Math.round(storageInfo.quota / (1024 * 1024)) - storageInfo.usedMB,
        shouldArchive: storageInfo.percentUsed > 70,
        shouldBackup: storageInfo.percentUsed > 50
      };

      return recommendations;
    } catch (error) {
      console.error('Error calculating recommendations:', error);
      return null;
    }
  }
};
