// src/firebase.js

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/* =====================================
   🔹 Your Firebase Config (REPLACE THIS)
===================================== */

const firebaseConfig = {
   apiKey: "AIzaSyBn1zsMozpnOEYi10dOpFEZojUHFuPFFcE",
  authDomain: "cinrecnt-calendar.firebaseapp.com",
  projectId: "cinrecnt-calendar",
  storageBucket: "cinrecnt-calendar.firebasestorage.app",
  messagingSenderId: "499722825397",
  appId: "1:499722825397:web:aab8a69283e4df374b58fc"
};

/* =====================================
   🔹 Main App (Prevent Re-init)
===================================== */

const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

/* =====================================
   🔹 Main Auth (Normal Login)
===================================== */

export const auth = getAuth(app);

/* =====================================
   🔹 Firestore
===================================== */

export const db = getFirestore(app);

/* =====================================
   🔹 Secondary App (Admin Creates Users)
===================================== */

const secondaryApp = !getApps().find(app => app.name === 'Secondary')
  ? initializeApp(firebaseConfig, 'Secondary')
  : getApp('Secondary');

/* =====================================
   🔹 Secondary Auth
===================================== */

export const secondaryAuth = getAuth(secondaryApp);

/* =====================================
   🔹 Export App (Optional)
===================================== */

export default app;
