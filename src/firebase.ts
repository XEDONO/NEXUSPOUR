import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration for Firebase
// Replace these with your actual Firebase project configuration from Firebase Console:
// https://console.firebase.google.com/
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForCafeOpsGithubPages000",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cafeops-nexuspour.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cafeops-nexuspour",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cafeops-nexuspour.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "102938475610",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:102938475610:web:abcdef1234567890"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
