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

async function resetGRNToOne() {
  try {
    console.log('🔄 Resetting GRN counter to start from 1...');
    
    await db.collection('counters').doc('grnNumber').set({
      value: 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ GRN counter reset to 0');
    console.log('📝 Next GRN will be: 1');
    console.log('');
    console.log('🎉 Ready! Next purchase will get GRN #1');
    
  } catch (error) {
    console.error('❌ Error resetting GRN counter:', error);
  }
  
  process.exit();
}

resetGRNToOne();