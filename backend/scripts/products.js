import { getFirestore, initializeFirebase } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const OPERATIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list'
};

const productCRUD = async () => {
  try {
    initializeFirebase();
    const db = getFirestore();
    
    if (!db) {
      console.error('❌ Firebase not initialized. Check your .env configuration.');
      process.exit(1);
    }

    const args = process.argv.slice(2);
    const operation = args[0]?.toLowerCase();

    if (!operation || !OPERATIONS[operation.toUpperCase()]) {
      showProductUsage();
      process.exit(0);
    }

    switch (operation) {
      case OPERATIONS.CREATE:
        await createProduct(db, args);
        break;
      case OPERATIONS.READ:
        await readProduct(db, args[1]);
        break;
      case OPERATIONS.UPDATE:
        await updateProduct(db, args);
        break;
      case OPERATIONS.DELETE:
        await deleteProduct(db, args[1]);
        break;
      case OPERATIONS.LIST:
        await listProducts(db);
        break;
      default:
        showProductUsage();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

const createProduct = async (db, args) => {
  if (args.length < 3) {
    console.error('❌ Missing required parameters');
    console.log('Usage: node products.js create <name> <purchaseRate> <salesRate> [sku] [category] [stock]');
    process.exit(1);
  }

  const product = {
    id: 'prod_' + uuidv4().slice(0, 8),
    productName: args[1],
    sku: args[4] || 'SKU_' + uuidv4().slice(0, 6).toUpperCase(),
    purchaseRate: parseFloat(args[2]),
    salesRate: parseFloat(args[3]),
    currentStock: parseInt(args[6]) || 0,
    minStock: 5,
    maxStock: 100,
    category: args[5] || 'General',
    description: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.collection('products').doc(product.id).set(product);
  console.log(`✅ Product created successfully!`);
  console.log('📦 Product Details:', JSON.stringify(product, null, 2));
};

const readProduct = async (db, productId) => {
  if (!productId) {
    console.error('❌ Product ID is required');
    console.log('Usage: node products.js read <productId>');
    process.exit(1);
  }

  const doc = await db.collection('products').doc(productId).get();
  if (!doc.exists) {
    console.error(`❌ Product with ID ${productId} not found`);
    process.exit(1);
  }

  console.log('📦 Product Details:');
  console.log(JSON.stringify(doc.data(), null, 2));
};

const updateProduct = async (db, args) => {
  if (args.length < 3) {
    console.error('❌ Missing required parameters');
    console.log('Usage: node products.js update <productId> <field> <value>');
    console.log('Fields: productName, purchaseRate, salesRate, currentStock, category, description');
    process.exit(1);
  }

  const productId = args[1];
  const field = args[2];
  const value = args[3];

  const doc = await db.collection('products').doc(productId).get();
  if (!doc.exists) {
    console.error(`❌ Product with ID ${productId} not found`);
    process.exit(1);
  }

  const updateData = {
    [field]: isNaN(value) ? value : parseFloat(value),
    updatedAt: new Date().toISOString()
  };

  await db.collection('products').doc(productId).update(updateData);
  console.log(`✅ Product updated successfully!`);
  console.log(`Field "${field}" updated to: ${value}`);
};

const deleteProduct = async (db, productId) => {
  if (!productId) {
    console.error('❌ Product ID is required');
    console.log('Usage: node products.js delete <productId>');
    process.exit(1);
  }

  const doc = await db.collection('products').doc(productId).get();
  if (!doc.exists) {
    console.error(`❌ Product with ID ${productId} not found`);
    process.exit(1);
  }

  await db.collection('products').doc(productId).delete();
  console.log(`✅ Product deleted successfully!`);
  console.log(`Deleted product: ${doc.data().productName}`);
};

const listProducts = async (db) => {
  const snapshot = await db.collection('products').get();
  
  if (snapshot.empty) {
    console.log('📦 No products found in the database');
    return;
  }

  console.log(`\n📦 Total Products: ${snapshot.size}\n`);
  console.log('Product List:');
  console.log('─'.repeat(80));
  
  snapshot.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. ${data.productName}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   SKU: ${data.sku}`);
    console.log(`   Purchase Rate: ₹${data.purchaseRate}`);
    console.log(`   Sales Rate: ₹${data.salesRate}`);
    console.log(`   Stock: ${data.currentStock}`);
    console.log(`   Category: ${data.category}`);
    console.log('');
  });
};

const showProductUsage = () => {
  console.log(`
📦 Product CRUD Operations

Usage: node products.js <operation> [options]

Operations:
  create <name> <purchaseRate> <salesRate> [sku] [category] [stock]
    Create a new product
    Example: node products.js create "Laptop" 35000 45000 PROD001 Electronics 10

  read <productId>
    Get product details
    Example: node products.js read prod_abc12345

  update <productId> <field> <value>
    Update product field
    Example: node products.js update prod_abc12345 currentStock 25

  delete <productId>
    Delete a product
    Example: node products.js delete prod_abc12345

  list
    List all products
    Example: node products.js list
  `);
};

productCRUD();
