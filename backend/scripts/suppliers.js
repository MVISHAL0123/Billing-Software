import { getFirestore, initializeFirebase } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const OPERATIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list'
};

const supplierCRUD = async () => {
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
      showSupplierUsage();
      process.exit(0);
    }

    switch (operation) {
      case OPERATIONS.CREATE:
        await createSupplier(db, args);
        break;
      case OPERATIONS.READ:
        await readSupplier(db, args[1]);
        break;
      case OPERATIONS.UPDATE:
        await updateSupplier(db, args);
        break;
      case OPERATIONS.DELETE:
        await deleteSupplier(db, args[1]);
        break;
      case OPERATIONS.LIST:
        await listSuppliers(db);
        break;
      default:
        showSupplierUsage();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

const createSupplier = async (db, args) => {
  if (args.length < 3) {
    console.error('❌ Missing required parameters');
    console.log('Usage: node suppliers.js create <name> <phoneNumber> [email] [place] [gstNumber]');
    process.exit(1);
  }

  const supplier = {
    id: 'supp_' + uuidv4().slice(0, 8),
    supplierName: args[1],
    phoneNumber: args[2],
    email: args[3] || '',
    place: args[4] || '',
    gstNumber: args[5] || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.collection('suppliers').doc(supplier.id).set(supplier);
  console.log(`✅ Supplier created successfully!`);
  console.log('🏭 Supplier Details:', JSON.stringify(supplier, null, 2));
};

const readSupplier = async (db, supplierId) => {
  if (!supplierId) {
    console.error('❌ Supplier ID is required');
    console.log('Usage: node suppliers.js read <supplierId>');
    process.exit(1);
  }

  const doc = await db.collection('suppliers').doc(supplierId).get();
  if (!doc.exists) {
    console.error(`❌ Supplier with ID ${supplierId} not found`);
    process.exit(1);
  }

  console.log('🏭 Supplier Details:');
  console.log(JSON.stringify(doc.data(), null, 2));
};

const updateSupplier = async (db, args) => {
  if (args.length < 3) {
    console.error('❌ Missing required parameters');
    console.log('Usage: node suppliers.js update <supplierId> <field> <value>');
    console.log('Fields: supplierName, phoneNumber, email, place, gstNumber');
    process.exit(1);
  }

  const supplierId = args[1];
  const field = args[2];
  const value = args[3];

  const doc = await db.collection('suppliers').doc(supplierId).get();
  if (!doc.exists) {
    console.error(`❌ Supplier with ID ${supplierId} not found`);
    process.exit(1);
  }

  const updateData = {
    [field]: value,
    updatedAt: new Date().toISOString()
  };

  await db.collection('suppliers').doc(supplierId).update(updateData);
  console.log(`✅ Supplier updated successfully!`);
  console.log(`Field "${field}" updated to: ${value}`);
};

const deleteSupplier = async (db, supplierId) => {
  if (!supplierId) {
    console.error('❌ Supplier ID is required');
    console.log('Usage: node suppliers.js delete <supplierId>');
    process.exit(1);
  }

  const doc = await db.collection('suppliers').doc(supplierId).get();
  if (!doc.exists) {
    console.error(`❌ Supplier with ID ${supplierId} not found`);
    process.exit(1);
  }

  await db.collection('suppliers').doc(supplierId).delete();
  console.log(`✅ Supplier deleted successfully!`);
  console.log(`Deleted supplier: ${doc.data().supplierName}`);
};

const listSuppliers = async (db) => {
  const snapshot = await db.collection('suppliers').get();
  
  if (snapshot.empty) {
    console.log('🏭 No suppliers found in the database');
    return;
  }

  console.log(`\n🏭 Total Suppliers: ${snapshot.size}\n`);
  console.log('Supplier List:');
  console.log('─'.repeat(80));
  
  snapshot.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. ${data.supplierName}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Phone: ${data.phoneNumber}`);
    console.log(`   Email: ${data.email || 'N/A'}`);
    console.log(`   Place: ${data.place || 'N/A'}`);
    console.log(`   GST Number: ${data.gstNumber || 'N/A'}`);
    console.log('');
  });
};

const showSupplierUsage = () => {
  console.log(`
🏭 Supplier CRUD Operations

Usage: node suppliers.js <operation> [options]

Operations:
  create <name> <phoneNumber> [email] [place] [gstNumber]
    Create a new supplier
    Example: node suppliers.js create "Global Supplies" "9123456789" "sales@global.com" "Delhi" "07AABCT1234H1Z0"

  read <supplierId>
    Get supplier details
    Example: node suppliers.js read supp_abc12345

  update <supplierId> <field> <value>
    Update supplier field
    Example: node suppliers.js update supp_abc12345 phoneNumber 9888888888

  delete <supplierId>
    Delete a supplier
    Example: node suppliers.js delete supp_abc12345

  list
    List all suppliers
    Example: node suppliers.js list
  `);
};

supplierCRUD();
