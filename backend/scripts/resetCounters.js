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

async function resetCounters() {
  console.log('🔄 Resetting Firebase Counters...\n');

  try {
    // Reset Bill Number Counter
    console.log('📋 Checking Bills...');
    const billsSnapshot = await db.collection('bills').get();
    const maxBillNo = billsSnapshot.docs.reduce((max, doc) => {
      const billNo = parseInt(doc.data().billNo);
      if (!isNaN(billNo)) {
        console.log(`   Found Bill #${billNo}`);
        return billNo > max ? billNo : max;
      }
      return max;
    }, 0);

    console.log(`\n✅ Maximum Bill Number found: ${maxBillNo}`);
    console.log(`📝 Setting counter to: ${maxBillNo}`);
    
    await db.collection('counters').doc('billNumber').set({
      value: maxBillNo,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Bill counter reset! Next bill will be: ${maxBillNo + 1}\n`);

    // Reset GRN Number Counter
    console.log('📦 Checking Purchases...');
    const purchasesSnapshot = await db.collection('purchases').get();
    const maxGRN = purchasesSnapshot.docs.reduce((max, doc) => {
      const grnNo = parseInt(doc.data().grnNo);
      if (!isNaN(grnNo)) {
        console.log(`   Found GRN #${grnNo}`);
        return grnNo > max ? grnNo : max;
      }
      return max;
    }, 0);

    console.log(`\n✅ Maximum GRN Number found: ${maxGRN}`);
    console.log(`📝 Setting counter to: ${maxGRN}`);
    
    await db.collection('counters').doc('grnNumber').set({
      value: maxGRN,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ GRN counter reset! Next GRN will be: ${maxGRN + 1}\n`);

    console.log('═'.repeat(50));
    console.log('✅ COUNTERS RESET SUCCESSFULLY!');
    console.log('═'.repeat(50));
    console.log(`Bills: ${billsSnapshot.size} documents, Next: ${maxBillNo + 1}`);
    console.log(`Purchases: ${purchasesSnapshot.size} documents, Next: ${maxGRN + 1}`);
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('❌ Error resetting counters:', error);
    throw error;
  }
}

resetCounters()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
