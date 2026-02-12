import mongoose from 'mongoose';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// MongoDB Connection String - UPDATE THIS WITH YOUR MONGODB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/billing-system';

// Firebase Admin initialization
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();

// Define MongoDB Schemas
const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const customerSchema = new mongoose.Schema({}, { strict: false, collection: 'customers' });
const productSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const supplierSchema = new mongoose.Schema({}, { strict: false, collection: 'suppliers' });
const billSchema = new mongoose.Schema({}, { strict: false, collection: 'bills' });
const purchaseSchema = new mongoose.Schema({}, { strict: false, collection: 'purchases' });

const User = mongoose.model('User', userSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Product = mongoose.model('Product', productSchema);
const Supplier = mongoose.model('Supplier', supplierSchema);
const Bill = mongoose.model('Bill', billSchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);

// Migration function for a collection
async function migrateCollection(MongoModel, firebaseCollection, collectionName) {
  try {
    console.log(`\n📦 Migrating ${collectionName}...`);
    
    // Fetch all documents from MongoDB
    const documents = await MongoModel.find({}).lean();
    
    if (documents.length === 0) {
      console.log(`   ⚠️  No documents found in ${collectionName}`);
      return { success: 0, failed: 0 };
    }

    console.log(`   Found ${documents.length} documents`);
    
    let successCount = 0;
    let failedCount = 0;

    // Batch write to Firebase
    const batch = db.batch();
    const batchSize = 500; // Firestore limit
    let currentBatch = 0;

    for (let i = 0; i < documents.length; i++) {
      try {
        const doc = documents[i];
        
        // Convert MongoDB _id to string and use as Firebase document ID
        const docId = doc._id.toString();
        delete doc._id; // Remove _id from document data
        delete doc.__v; // Remove MongoDB version key
        
        // Convert Date objects and other special types
        const cleanDoc = JSON.parse(JSON.stringify(doc));
        
        // Add to batch
        const docRef = db.collection(firebaseCollection).doc(docId);
        batch.set(docRef, cleanDoc);
        
        currentBatch++;
        
        // Commit batch when it reaches the limit
        if (currentBatch >= batchSize) {
          await batch.commit();
          successCount += currentBatch;
          currentBatch = 0;
          console.log(`   ✅ Migrated ${successCount} documents...`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to migrate document: ${error.message}`);
        failedCount++;
      }
    }
    
    // Commit remaining documents
    if (currentBatch > 0) {
      await batch.commit();
      successCount += currentBatch;
    }
    
    console.log(`   ✅ Successfully migrated ${successCount} ${collectionName}`);
    if (failedCount > 0) {
      console.log(`   ❌ Failed to migrate ${failedCount} ${collectionName}`);
    }
    
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
    return { success: 0, failed: 0, error: error.message };
  }
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting MongoDB to Firebase Migration...\n');
  console.log('📍 MongoDB URI:', MONGODB_URI);
  console.log('📍 Firebase Project:', process.env.FIREBASE_PROJECT_ID);
  
  try {
    // Connect to MongoDB
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const results = {};

    // Migrate each collection
    results.users = await migrateCollection(User, 'users', 'Users');
    results.customers = await migrateCollection(Customer, 'customers', 'Customers');
    results.products = await migrateCollection(Product, 'products', 'Products');
    results.suppliers = await migrateCollection(Supplier, 'suppliers', 'Suppliers');
    results.bills = await migrateCollection(Bill, 'bills', 'Bills');
    results.purchases = await migrateCollection(Purchase, 'purchases', 'Purchases');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    
    let totalSuccess = 0;
    let totalFailed = 0;
    
    Object.entries(results).forEach(([collection, result]) => {
      console.log(`${collection.toUpperCase()}: ${result.success} migrated, ${result.failed} failed`);
      totalSuccess += result.success;
      totalFailed += result.failed;
    });
    
    console.log('='.repeat(50));
    console.log(`TOTAL: ${totalSuccess} documents migrated successfully`);
    if (totalFailed > 0) {
      console.log(`FAILED: ${totalFailed} documents`);
    }
    console.log('='.repeat(50));
    
    console.log('\n✅ Migration completed!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration error:', error);
    process.exit(1);
  });
