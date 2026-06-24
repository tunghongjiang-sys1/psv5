// lib/firebaseConfig.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  Auth,
} from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

// Firebase configuration for ps-d-228ec
const firebaseConfig = {
  apiKey: 'AIzaSyCtbS05D9qXpHJk54z5v3iADl4NWojXXlQ',
  authDomain: 'ps-d-228ec.firebaseapp.com',
  databaseURL: 'https://ps-d-228ec-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'ps-d-228ec',
  storageBucket: 'ps-d-228ec.firebasestorage.app',
  messagingSenderId: '144746123825',
  appId: '1:144746123825:web:b10dcea0e82aa839babb10',
  measurementId: 'G-BHFEE295BK',
};

let app: FirebaseApp;
let auth: Auth;
let db: Database;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);

  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
  });

  db = getDatabase(app);
} else {
  app = getApps()[0]!;
  auth = getAuth(app);
  db = getDatabase(app);
}

export { app, auth, db };