/**
 * Data Export/Import Utility Service
 * Handles CSV and JSON export/import operations
 */

export const dataExportService = {
  /**
   * Export data as JSON file
   */
  exportAsJSON(data, filename = 'billing-backup') {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('✅ JSON exported successfully');
      return { success: true };
    } catch (error) {
      console.error('Export error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Export bills as CSV
   */
  exportBillsAsCSV(bills) {
    try {
      let csv = 'Bill Number,Date,Customer,Total,Status\n';
      bills.forEach(bill => {
        csv += `"${bill.billNumber}","${bill.date}","${bill.customerName}","${bill.total}","${bill.status}"\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bills-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('✅ Bills CSV exported successfully');
      return { success: true };
    } catch (error) {
      console.error('CSV export error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Export purchases as CSV
   */
  exportPurchasesAsCSV(purchases) {
    try {
      let csv = 'GRN Number,Date,Supplier,Total,Status\n';
      purchases.forEach(purchase => {
        csv += `"${purchase.grnNumber}","${purchase.date}","${purchase.supplierName}","${purchase.total}","${purchase.status}"\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `purchases-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('✅ Purchases CSV exported successfully');
      return { success: true };
    } catch (error) {
      console.error('CSV export error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Import JSON file
   */
  importFromJSON(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          console.log('✅ JSON imported successfully');
          resolve({ success: true, data });
        } catch (error) {
          console.error('Import error:', error);
          resolve({ success: false, error: 'Invalid JSON file' });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read file' });
      };
      reader.readAsText(file);
    });
  },

  /**
   * Generate download link for backup
   */
  downloadBackup(data, filename = 'backup') {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
