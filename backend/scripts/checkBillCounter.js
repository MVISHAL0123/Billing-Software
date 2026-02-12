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

async function testBillCounter() {
  console.log('🧪 Testing Bill Counter...\n');

  try {
    // Check counter value
    const counterDoc = await db.collection('counters').doc('billNumber').get();
    
    if (counterDoc.exists) {
      const currentValue = counterDoc.data().value;
      console.log(`📊 Current Counter Value: ${currentValue}`);
      console.log(`📝 Next Bill Number Will Be: ${currentValue + 1}`);
      
      // Check actual bills
      const billsSnapshot = await db.collection('bills').get();
      console.log(`\n📋 Total Bills in Database: ${billsSnapshot.size}`);
      
      const billNumbers = [];
      billsSnapshot.forEach(doc => {
        const billNo = doc.data().billNo;
        billNumbers.push(billNo);
      });
      
      billNumbers.sort((a, b) => parseInt(a) - parseInt(b));
      console.log(`📝 Bill Numbers: ${billNumbers.join(', ')}`);
      
      const maxBill = Math.max(...billNumbers.map(b => parseInt(b)));
      console.log(`\n✅ Highest Bill Number: ${maxBill}`);
      console.log(`✅ Expected Next Bill: ${maxBill + 1}`);
      console.log(`📊 Counter Says Next: ${currentValue + 1}`);
      
      if (currentValue === maxBill) {
        console.log('\n✅✅✅ COUNTER IS CORRECT! ✅✅✅');
      } else {
        console.log('\n❌ COUNTER IS WRONG!');
        console.log(`   Should be: ${maxBill}, but is: ${currentValue}`);
      }
    } else {
      console.log('❌ Counter does not exist!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

testBillCounter();
