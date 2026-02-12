import mongoose from 'mongoose';
import { initializeFirebase } from '../config/database.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Supplier from '../models/Supplier.js';
import Bill from '../models/Bill.js';
import Purchase from '../models/Purchase.js';

// MongoDB Models (old structure)
const MongoUser = mongoose.model('MongoUser', new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  role: String,
  createdAt: Date,
  updatedAt: Date
}));

const MongoCustomer = mongoose.model('MongoCustomer', new mongoose.Schema({
  customerName: String,
  place: String,
  phoneNumber: String,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date
}));

const MongoProduct = mongoose.model('MongoProduct', new mongoose.Schema({
  productName: String,
  tamilName: String,
  purchaseRate: Number,
  salesRate: Number,
  marginPercentage: Number,
  currentStock: Number,
  margin: Number,
  minStockLevel: Number,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date
}));

const MongoSupplier = mongoose.model('MongoSupplier', new mongoose.Schema({
  supplierName: String,
  place: String,
  phoneNumber: String,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date
}));

const MongoBill = mongoose.model('MongoBill', new mongoose.Schema({
  billNo: String,
  date: Date,
  customer: {
    customerId: mongoose.Schema.Types.ObjectId,
    customerName: String,
    phoneNumber: String,
    place: String
  },
  items: [{
    productName: String,
    qty: Number,
    rate: Number,
    amount: Number,
    purchaseRate: Number,
    salesRate: Number,
    margin: Number,
    marginPercentage: Number,
    freeQty: Number,
    profitPerItem: Number,
    totalProfit: Number
  }],
  subtotal: Number,
  total: Number,
  totalProfit: Number,
  marginPercentage: Number,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date
}));

const MongoPurchase = mongoose.model('MongoPurchase', new mongoose.Schema({
  billNo: String,
  grnNo: String,
  date: Date,
  supplier: {
    supplierId: mongoose.Schema.Types.ObjectId,
    supplierName: String,
    phoneNumber: String,
    place: String
  },
  items: [{
    productName: String,
    qty: Number,
    purchaseRate: Number,
    salesRate: Number,
    margin: Number,
    marginPercentage: Number,
    freeQty: Number,
    amount: Number
  }],
  subtotal: Number,
  total: Number,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date
}));

async function migrateData() {
  try {
    console.log('🔄 Starting migration from MongoDB to Firebase...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/billing_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Initialize Firebase
    initializeFirebase();
    console.log('✅ Connected to Firebase');

    // Migrate Users
    console.log('👥 Migrating users...');
    const mongoUsers = await MongoUser.find();
    let userCount = 0;
    const userMapping = new Map(); // Map old ObjectId to new Firebase ID

    for (const mongoUser of mongoUsers) {
      try {
        const firebaseUser = new User({
          username: mongoUser.username,
          password: mongoUser.password,
          name: mongoUser.name,
          role: mongoUser.role
        });
        const savedUser = await firebaseUser.save();
        userMapping.set(mongoUser._id.toString(), savedUser.id);
        userCount++;
        console.log(`   ✓ Migrated user: ${mongoUser.username}`);
      } catch (error) {
        console.log(`   ⚠️ Skipped user ${mongoUser.username}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${userCount} users`);

    // Migrate Customers
    console.log('👥 Migrating customers...');
    const mongoCustomers = await MongoCustomer.find();
    let customerCount = 0;
    const customerMapping = new Map();

    for (const mongoCustomer of mongoCustomers) {
      try {
        const createdBy = userMapping.get(mongoCustomer.createdBy?.toString()) || 'migrated-user';
        const firebaseCustomer = new Customer({
          customerName: mongoCustomer.customerName,
          place: mongoCustomer.place,
          phoneNumber: mongoCustomer.phoneNumber,
          createdBy: createdBy
        });
        const savedCustomer = await firebaseCustomer.save();
        customerMapping.set(mongoCustomer._id.toString(), savedCustomer.id);
        customerCount++;
        console.log(`   ✓ Migrated customer: ${mongoCustomer.customerName}`);
      } catch (error) {
        console.log(`   ⚠️ Skipped customer ${mongoCustomer.customerName}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${customerCount} customers`);

    // Migrate Suppliers
    console.log('🏪 Migrating suppliers...');
    const mongoSuppliers = await MongoSupplier.find();
    let supplierCount = 0;
    const supplierMapping = new Map();

    for (const mongoSupplier of mongoSuppliers) {
      try {
        const createdBy = userMapping.get(mongoSupplier.createdBy?.toString()) || 'migrated-user';
        const firebaseSupplier = new Supplier({
          supplierName: mongoSupplier.supplierName,
          place: mongoSupplier.place,
          phoneNumber: mongoSupplier.phoneNumber,
          createdBy: createdBy
        });
        const savedSupplier = await firebaseSupplier.save();
        supplierMapping.set(mongoSupplier._id.toString(), savedSupplier.id);
        supplierCount++;
        console.log(`   ✓ Migrated supplier: ${mongoSupplier.supplierName}`);
      } catch (error) {
        console.log(`   ⚠️ Skipped supplier ${mongoSupplier.supplierName}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${supplierCount} suppliers`);

    // Migrate Products
    console.log('📦 Migrating products...');
    const mongoProducts = await MongoProduct.find();
    let productCount = 0;

    for (const mongoProduct of mongoProducts) {
      try {
        const createdBy = userMapping.get(mongoProduct.createdBy?.toString()) || 'migrated-user';
        const firebaseProduct = new Product({
          productName: mongoProduct.productName,
          tamilName: mongoProduct.tamilName || '',
          purchaseRate: mongoProduct.purchaseRate || 0,
          salesRate: mongoProduct.salesRate || 0,
          marginPercentage: mongoProduct.marginPercentage || 0,
          currentStock: mongoProduct.currentStock || 0,
          margin: mongoProduct.margin || 0,
          minStockLevel: mongoProduct.minStockLevel || 0,
          createdBy: createdBy
        });
        await firebaseProduct.save();
        productCount++;
        console.log(`   ✓ Migrated product: ${mongoProduct.productName}`);
      } catch (error) {
        console.log(`   ⚠️ Skipped product ${mongoProduct.productName}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${productCount} products`);

    // Migrate Bills
    console.log('🧾 Migrating bills...');
    const mongoBills = await MongoBill.find();
    let billCount = 0;

    for (const mongoBill of mongoBills) {
      try {
        const createdBy = userMapping.get(mongoBill.createdBy?.toString()) || 'migrated-user';
        const customerId = customerMapping.get(mongoBill.customer?.customerId?.toString()) || null;
        
        const firebaseBill = new Bill({
          billNo: mongoBill.billNo,
          date: mongoBill.date,
          customer: {
            customerId: customerId,
            customerName: mongoBill.customer?.customerName || 'Walk-in Customer',
            phoneNumber: mongoBill.customer?.phoneNumber || '',
            place: mongoBill.customer?.place || ''
          },
          items: mongoBill.items || [],
          subtotal: mongoBill.subtotal || 0,
          total: mongoBill.total || 0,
          totalProfit: mongoBill.totalProfit || 0,
          marginPercentage: mongoBill.marginPercentage || 0,
          createdBy: createdBy
        });
        await firebaseBill.save();
        billCount++;
        console.log(`   ✓ Migrated bill: ${mongoBill.billNo}`);
      } catch (error) {
        console.log(`   ⚠️ Skipped bill ${mongoBill.billNo}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${billCount} bills`);

    // Migrate Purchases
    console.log('🛒 Migrating purchases...');
    const mongoPurchases = await MongoPurchase.find();
    let purchaseCount = 0;

    for (const mongoPurchase of mongoPurchases) {
      try {
        const createdBy = userMapping.get(mongoPurchase.createdBy?.toString()) || 'migrated-user';
        const supplierId = supplierMapping.get(mongoPurchase.supplier?.supplierId?.toString()) || null;
        
        const firebasePurchase = new Purchase({
          billNo: mongoPurchase.billNo,
          grnNo: mongoPurchase.grnNo,
          date: mongoPurchase.date,
          supplier: {
            supplierId: supplierId,
            supplierName: mongoPurchase.supplier?.supplierName || '',
            phoneNumber: mongoPurchase.supplier?.phoneNumber || '',
            place: mongoPurchase.supplier?.place || ''
          },
          items: mongoPurchase.items || [],
          subtotal: mongoPurchase.subtotal || 0,
          total: mongoPurchase.total || 0,
          createdBy: createdBy
        });
        await firebasePurchase.save();
        purchaseCount++;
        console.log(`   ✓ Migrated purchase: ${mongoPurchase.billNo}`);
      } catch (error) {
        console.log(`   ⚠️ Skipped purchase ${mongoPurchase.billNo}: ${error.message}`);
      }
    }
    console.log(`✅ Migrated ${purchaseCount} purchases`);

    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Summary:
    - Users: ${userCount}
    - Customers: ${customerCount}
    - Suppliers: ${supplierCount}
    - Products: ${productCount}
    - Bills: ${billCount}
    - Purchases: ${purchaseCount}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
if (process.argv[2] === 'run') {
  migrateData().then(() => {
    console.log('✅ Migration process completed');
    process.exit(0);
  });
} else {
  console.log('To run migration, use: node src/utils/migrateFromMongo.js run');
  console.log('⚠️  Warning: This will copy ALL data from MongoDB to Firebase');
  console.log('⚠️  Make sure Firebase is properly configured before running');
}

export default migrateData;