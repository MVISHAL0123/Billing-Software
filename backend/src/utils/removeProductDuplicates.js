import { getFirestore } from '../../config/database.js';

const removeProductDuplicates = async () => {
  try {
    const db = getFirestore();
    
    if (!db) {
      console.error('✗ Firebase not initialized. Please check your credentials.');
      process.exit(1);
    }
    
    console.log('🔥 Firebase Firestore connected\n');
    
    // Get all products
    const productsSnapshot = await db.collection('products').get();
    const allProducts = [];
    
    productsSnapshot.forEach(doc => {
      allProducts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('=== ALL PRODUCTS IN DATABASE ===');
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.productName} - Stock: ${product.currentStock} - ID: ${product.id}`);
    });
    console.log('\n');
    
    // Find duplicates by product name
    const productNames = {};
    const duplicates = {};
    
    allProducts.forEach(product => {
      const name = product.productName.toLowerCase().trim();
      if (!productNames[name]) {
        productNames[name] = [];
      }
      productNames[name].push(product);
      
      if (productNames[name].length > 1) {
        duplicates[name] = productNames[name];
      }
    });
    
    if (Object.keys(duplicates).length === 0) {
      console.log('✓ No duplicate products found!');
      process.exit(0);
    }
    
    console.log(`Found ${Object.keys(duplicates).length} duplicate product(s):\n`);
    
    let totalToDelete = 0;
    
    for (const [name, products] of Object.entries(duplicates)) {
      console.log(`📦 "${name}" appears ${products.length} times:`);
      products.forEach((p, idx) => {
        console.log(`   ${idx + 1}. Stock: ${p.currentStock} - Rate: ₹${p.purchaseRate} - ID: ${p.id}`);
      });
      
      // Keep the one with highest stock, delete others
      const sortedByStock = products.sort((a, b) => b.currentStock - a.currentStock);
      const toKeep = sortedByStock[0];
      const toDelete = sortedByStock.slice(1);
      
      console.log(`   ✓ Keeping: ${toKeep.productName} (Stock: ${toKeep.currentStock})`);
      console.log(`   ✗ Deleting ${toDelete.length} duplicate(s)...`);
      
      for (const product of toDelete) {
        await db.collection('products').doc(product.id).delete();
        console.log(`      ✗ Deleted ID: ${product.id}`);
        totalToDelete++;
      }
      console.log('');
    }
    
    console.log(`\n✓ Duplicate removal completed! Deleted ${totalToDelete} product(s)`);
    
    // Show remaining products
    const remainingSnapshot = await db.collection('products').get();
    const remainingProducts = [];
    
    remainingSnapshot.forEach(doc => {
      remainingProducts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('\n=== REMAINING PRODUCTS ===');
    remainingProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.productName} - Stock: ${product.currentStock}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
};

removeProductDuplicates();
