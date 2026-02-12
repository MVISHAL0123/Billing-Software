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

// Check if already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

async function forceSetCounter() {
  console.log('🔧 FORCE SETTING COUNTER TO 5...\n');

  try {
    // Force set to 5 - no transactions, no checks
    await db.collection('counters').doc('billNumber').set({
      value: 5,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      note: 'Force set to 5 - Next bill will be 6'
    }, { merge: false });

    console.log('✅ Counter FORCE SET to 5');
    
    // Immediately verify
    const doc = await db.collection('counters').doc('billNumber').get();
    const value = doc.data().value;
    
    console.log(`\n📊 Verification: Counter value is now ${value}`);
    console.log(`✅ Next bill number will be: ${value + 1}`);
    
    if (value === 5) {
      console.log('\n✅✅✅ SUCCESS! ✅✅✅\n');
    } else {
      console.log('\n❌ FAILED! Counter is still wrong!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

forceSetCounter();
