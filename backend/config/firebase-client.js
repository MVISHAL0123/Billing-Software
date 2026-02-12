// Firebase Client Configuration
// This file contains your Firebase client configuration for the frontend

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;