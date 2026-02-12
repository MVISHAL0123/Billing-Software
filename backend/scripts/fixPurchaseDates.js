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

async function fixPurchaseDates() {
  try {
    console.log('🔄 Fixing date formats in purchase records...');
    console.log('');

    // Get all purchases
    const purchasesSnapshot = await db.collection('purchases').get();
    
    if (purchasesSnapshot.empty) {
      console.log('❌ No purchases found in database');
      return;
    }

    console.log(`📦 Found ${purchasesSnapshot.size} purchase records`);
    console.log('');

    const batch = db.batch();
    let updateCount = 0;

    for (const doc of purchasesSnapshot.docs) {
      const purchaseData = doc.data();
      const currentDate = purchaseData.date;
      
      console.log(`🔍 Checking purchase GRN: ${purchaseData.grnNo}`);
      console.log(`   Current date: ${JSON.stringify(currentDate)}`);
      
      let needsUpdate = false;
      let newDate = null;
      
      // Check if date needs fixing
      if (!currentDate) {
        // No date at all - set to today
        newDate = admin.firestore.Timestamp.now();
        needsUpdate = true;
        console.log('   ❌ No date found - setting to current timestamp');
      } else if (typeof currentDate === 'string') {
        // String date - convert to Firestore Timestamp
        try {
          const parsedDate = new Date(currentDate);
          if (isNaN(parsedDate.getTime())) {
            // Invalid date string - set to current timestamp
            newDate = admin.firestore.Timestamp.now();
            console.log('   ❌ Invalid date string - setting to current timestamp');
          } else {
            newDate = admin.firestore.Timestamp.fromDate(parsedDate);
            console.log('   🔄 Converting string date to Firestore Timestamp');
          }
          needsUpdate = true;
        } catch (error) {
          newDate = admin.firestore.Timestamp.now();
          needsUpdate = true;
          console.log('   ❌ Error parsing date - setting to current timestamp');
        }
      } else if (currentDate && typeof currentDate === 'object' && !currentDate.seconds) {
        // Not a proper Firestore Timestamp - try to convert
        try {
          if (currentDate.toDate) {
            // Has toDate method but might be malformed
            const dateObj = currentDate.toDate();
            newDate = admin.firestore.Timestamp.fromDate(dateObj);
            needsUpdate = true;
            console.log('   🔄 Converting malformed timestamp to proper Firestore Timestamp');
          } else {
            // Unknown format - set to current timestamp
            newDate = admin.firestore.Timestamp.now();
            needsUpdate = true;
            console.log('   ❌ Unknown date format - setting to current timestamp');
          }
        } catch (error) {
          newDate = admin.firestore.Timestamp.now();
          needsUpdate = true;
          console.log('   ❌ Error with timestamp object - setting to current timestamp');
        }
      } else if (currentDate && currentDate.seconds) {
        // Already a proper Firestore Timestamp
        console.log('   ✅ Date is already a proper Firestore Timestamp');
      } else {
        console.log('   ❓ Unknown date format:', typeof currentDate);
      }
      
      if (needsUpdate) {
        batch.update(doc.ref, {
          date: newDate,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updateCount++;
        console.log(`   ✅ Will update with: ${newDate.toDate().toLocaleDateString()}`);
      }
      
      console.log('');
    }

    if (updateCount > 0) {
      await batch.commit();
      console.log('═'.repeat(60));
      console.log('🎉 PURCHASE DATES FIXED!');
      console.log('═'.repeat(60));
      console.log(`📊 Summary:`);
      console.log(`   • Purchase records processed: ${purchasesSnapshot.size}`);
      console.log(`   • Records updated: ${updateCount}`);
      console.log(`   • Records already correct: ${purchasesSnapshot.size - updateCount}`);
      console.log('');
      console.log('📋 All purchase dates are now properly formatted!');
      console.log('🔄 Refresh purchase display to see corrected dates');
      console.log('═'.repeat(60));
    } else {
      console.log('✅ All purchase dates are already in correct format!');
    }

  } catch (error) {
    console.error('❌ Error fixing purchase dates:', error);
  }
  
  process.exit();
}

fixPurchaseDates();