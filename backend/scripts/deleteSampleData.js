import { getFirestore } from '../config/database.js';

const SAMPLE_IDS = {
  products: ['prod_001', 'prod_002', 'prod_003', 'prod_004', 'prod_005'],
  customers: ['cust_001', 'cust_002', 'cust_003'],
  suppliers: ['supp_001', 'supp_002']
};

const deleteSampleData = async () => {
  try {
    const db = getFirestore();
    if (!db) {
      console.log('Firebase database not initialized. Check your .env configuration.');
      process.exit(1);
    }
    
    console.log('Starting deletion of sample data...');

    console.log('Deleting sample products...');
    for (const productId of SAMPLE_IDS.products) {
      await db.collection('products').doc(productId).delete();
      console.log(`Deleted product: ${productId}`);
    }

    console.log('Deleting sample customers...');
    for (const customerId of SAMPLE_IDS.customers) {
      await db.collection('customers').doc(customerId).delete();
      console.log(`Deleted customer: ${customerId}`);
    }

    console.log('Deleting sample suppliers...');
    for (const supplierId of SAMPLE_IDS.suppliers) {
      await db.collection('suppliers').doc(supplierId).delete();
      console.log(`Deleted supplier: ${supplierId}`);
    }

    console.log('Sample data deletion completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting sample data:', error.message);
    process.exit(1);
  }
};

deleteSampleData();
