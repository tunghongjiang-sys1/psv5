// lib/firebaseConfig.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore'; // ← add this

// Your Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyC30BwjNVq2BMxsOQAXD9Y1yXL2Y2ArJD4',
  authDomain: 'projectserve-8cd90.firebaseapp.com',
  projectId: 'projectserve8cd90',
  storageBucket: 'projectserve-8cd90.firebasestorage.app',
  messagingSenderId: '1023876147059',
  appId: '1:1023876147059:web:0b75d3f5195619b1198706',
  measurementId: 'G-CFKNHFPPRN',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);

  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
  });

  db = getFirestore(app); // ← init Firestore [web:45][web:46]
} else {
  app = getApps()[0]!;
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };