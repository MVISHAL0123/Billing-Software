// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBETfLYgp7k6K36naN3fOnt4jaGVtXapvY",
  authDomain: "billing--software.firebaseapp.com",
  projectId: "billing--software",
  storageBucket: "billing--software.firebasestorage.app",
  messagingSenderId: "957234813759",
  appId: "1:957234813759:web:b1efd773702e314edc518a",
  measurementId: "G-RXZ57VKK55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
export default app;
