import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

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

async function deleteAllBills() {
  console.log('🔄 Deleting all bills from database...\n');

  try {
    // Get all bills
    console.log('📋 Counting bills to delete...');
    const billsSnapshot = await db.collection('bills').get();
    const billCount = billsSnapshot.size;
    
    console.log(`Found ${billCount} bills to delete\n`);

    // Delete all bills in batches
    if (billCount > 0) {
      const batch = db.batch();
      billsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        console.log(`   Deleting Bill #${doc.data().billNo}`);
      });
      
      await batch.commit();
      console.log(`\n✅ Successfully deleted ${billCount} bills!\n`);
    } else {
      console.log('ℹ️ No bills found to delete\n');
    }

    // Reset bill counter to 0 (next bill will be 1)
    console.log('🔢 Resetting bill counter...');
    await db.collection('counters').doc('billNumber').set({
      value: 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Bill counter reset to 0`);
    console.log(`📝 Next bill will be: 1\n`);
    
    console.log('✨ All done! Database cleaned and bill numbering reset.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting bills:', error.message);
    process.exit(1);
  }
}

deleteAllBills();
