import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase project configuration for nexus-2aa54
export const firebaseConfig = {
  apiKey: "AIzaSyBHYGOs7HJuRckszw40iEuFFx39ImjFzzg",
  authDomain: "nexus-2aa54.firebaseapp.com",
  projectId: "nexus-2aa54",
  storageBucket: "nexus-2aa54.firebasestorage.app",
  messagingSenderId: "90186946064",
  appId: "1:90186946064:web:6bfb7c94c325f261ec9c95",
  measurementId: "G-QWG030GXRJ"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
