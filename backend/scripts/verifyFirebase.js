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

async function verifyData() {
  console.log('🔍 Verifying Firebase Data...\n');
  
  const collections = ['users', 'customers', 'products', 'suppliers', 'bills', 'purchases'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    console.log(`📦 ${collectionName.toUpperCase()}: ${snapshot.size} documents`);
    
    if (snapshot.size > 0 && snapshot.size <= 3) {
      snapshot.forEach(doc => {
        console.log(`   - ${doc.id}`);
      });
    }
  }
  
  console.log('\n✅ Verification complete!');
  process.exit(0);
}

verifyData().catch(console.error);
