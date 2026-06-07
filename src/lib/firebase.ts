import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBI0bzu3rpL3j7nAwl6a0aq8epeeZvk4D4",
  authDomain: "smile-scorer.firebaseapp.com",
  projectId: "smile-scorer",
  storageBucket: "smile-scorer.firebasestorage.app",
  messagingSenderId: "550460452820",
  appId: "1:550460452820:web:b1ca0743317f74ddc4f041",
  measurementId: "G-CHGV8YV466"
};

// Initialize Firebase only if it hasn't been initialized already (important for Next.js hot reloading)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
