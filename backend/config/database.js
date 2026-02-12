import admin from 'firebase-admin';
import config from './config.js';

let db = null;

const initializeFirebase = () => {
  try {
    // Check if Firebase credentials are properly set
    if (!config.firebase.projectId || 
        !config.firebase.privateKey || 
        !config.firebase.clientEmail ||
        config.firebase.privateKey.includes('PLEASE_REPLACE') ||
        config.firebase.clientEmail.includes('xxxxx')) {
      
      console.log('🔥 Firebase credentials not configured yet.');
      console.log('📋 To set up Firebase:');
      console.log('   1. Go to https://console.firebase.google.com/');
      console.log('   2. Select project: billing--software');  
      console.log('   3. Go to Settings → Service Accounts');
      console.log('   4. Generate new private key');
      console.log('   5. Update .env file with the credentials');
      console.log('');
      console.log('⚠️  Server running without Firebase - data will not persist!');
      return null;
    }

    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
          clientEmail: config.firebase.clientEmail,
        }),
        databaseURL: config.firebase.databaseURL
      });
    }
    
    // Get Firestore database
    db = admin.firestore();
    console.log('🔥 Firebase connected successfully');
    return db;
  } catch (error) {
    console.log('🔥 Firebase connection failed:', error.message);
    console.log('📋 Please check your Firebase credentials in .env file');
    console.log('⚠️  Server running without Firebase - data will not persist!');
    return null;
  }
};

const getFirestore = () => {
  if (!db) {
    const initialized = initializeFirebase();
    if (!initialized) {
      console.log('⚠️  Firebase not initialized - operations will fail gracefully');
      return null;
    }
  }
  return db;
};

export { initializeFirebase, getFirestore };
export default { initializeFirebase, getFirestore };
