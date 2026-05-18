import { getFirestore, initializeFirebase } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const OPERATIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list'
};

const customerCRUD = async () => {
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
      showCustomerUsage();
      process.exit(0);
    }

    switch (operation) {
      case OPERATIONS.CREATE:
        await createCustomer(db, args);
        break;
      case OPERATIONS.READ:
        await readCustomer(db, args[1]);
        break;
      case OPERATIONS.UPDATE:
        await updateCustomer(db, args);
        break;
      case OPERATIONS.DELETE:
        await deleteCustomer(db, args[1]);
        break;
      case OPERATIONS.LIST:
        await listCustomers(db);
        break;
      default:
        showCustomerUsage();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

const createCustomer = async (db, args) => {
  if (args.length < 3) {
    console.error('❌ Missing required parameters');
    console.log('Usage: node customers.js create <name> <phoneNumber> [email] [place] [gstNumber]');
    process.exit(1);
  }

  const customer = {
    id: 'cust_' + uuidv4().slice(0, 8),
    customerName: args[1],
    phoneNumber: args[2],
    email: args[3] || '',
    place: args[4] || '',
    gstNumber: args[5] || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.collection('customers').doc(customer.id).set(customer);
  console.log(`✅ Customer created successfully!`);
  console.log('👤 Customer Details:', JSON.stringify(customer, null, 2));
};

const readCustomer = async (db, customerId) => {
  if (!customerId) {
    console.error('❌ Customer ID is required');
    console.log('Usage: node customers.js read <customerId>');
    process.exit(1);
  }

  const doc = await db.collection('customers').doc(customerId).get();
  if (!doc.exists) {
    console.error(`❌ Customer with ID ${customerId} not found`);
    process.exit(1);
  }

  console.log('👤 Customer Details:');
  console.log(JSON.stringify(doc.data(), null, 2));
};

const updateCustomer = async (db, args) => {
  if (args.length < 3) {
    console.error('❌ Missing required parameters');
    console.log('Usage: node customers.js update <customerId> <field> <value>');
    console.log('Fields: customerName, phoneNumber, email, place, gstNumber');
    process.exit(1);
  }

  const customerId = args[1];
  const field = args[2];
  const value = args[3];

  const doc = await db.collection('customers').doc(customerId).get();
  if (!doc.exists) {
    console.error(`❌ Customer with ID ${customerId} not found`);
    process.exit(1);
  }

  const updateData = {
    [field]: value,
    updatedAt: new Date().toISOString()
  };

  await db.collection('customers').doc(customerId).update(updateData);
  console.log(`✅ Customer updated successfully!`);
  console.log(`Field "${field}" updated to: ${value}`);
};

const deleteCustomer = async (db, customerId) => {
  if (!customerId) {
    console.error('❌ Customer ID is required');
    console.log('Usage: node customers.js delete <customerId>');
    process.exit(1);
  }

  const doc = await db.collection('customers').doc(customerId).get();
  if (!doc.exists) {
    console.error(`❌ Customer with ID ${customerId} not found`);
    process.exit(1);
  }

  await db.collection('customers').doc(customerId).delete();
  console.log(`✅ Customer deleted successfully!`);
  console.log(`Deleted customer: ${doc.data().customerName}`);
};

const listCustomers = async (db) => {
  const snapshot = await db.collection('customers').get();
  
  if (snapshot.empty) {
    console.log('👤 No customers found in the database');
    return;
  }

  console.log(`\n👤 Total Customers: ${snapshot.size}\n`);
  console.log('Customer List:');
  console.log('─'.repeat(80));
  
  snapshot.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. ${data.customerName}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Phone: ${data.phoneNumber}`);
    console.log(`   Email: ${data.email || 'N/A'}`);
    console.log(`   Place: ${data.place || 'N/A'}`);
    console.log(`   GST Number: ${data.gstNumber || 'N/A'}`);
    console.log('');
  });
};

const showCustomerUsage = () => {
  console.log(`
👤 Customer CRUD Operations

Usage: node customers.js <operation> [options]

Operations:
  create <name> <phoneNumber> [email] [place] [gstNumber]
    Create a new customer
    Example: node customers.js create "Acme Corp" "9876543210" "contact@acme.com" "Chennai" "33AABCT1234H1Z0"

  read <customerId>
    Get customer details
    Example: node customers.js read cust_abc12345

  update <customerId> <field> <value>
    Update customer field
    Example: node customers.js update cust_abc12345 phoneNumber 9999999999

  delete <customerId>
    Delete a customer
    Example: node customers.js delete cust_abc12345

  list
    List all customers
    Example: node customers.js list
  `);
};

customerCRUD();
