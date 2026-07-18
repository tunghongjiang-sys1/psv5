

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, type Auth } from 'firebase/auth';

import { ref, set, update, remove, onValue } from 'firebase/database';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCtbS05D9qXpHJk54z5v3iADl4NWojXXlQ',
  authDomain: 'ps-d-228ec.firebaseapp.com',
  databaseURL:
    'https://ps-d-228ec-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'ps-d-228ec',
  storageBucket: 'ps-d-228ec.firebasestorage.app',
  messagingSenderId: '144746123825',
  appId: '1:144746123825:web:c85ab22fffe5f907babb10',
  
  
};

const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export { app };
export const db: Database = getDatabase(app);
export const auth: Auth = getAuth(app);

export { ref, set, update, remove, onValue };
export { signInAnonymously, onAuthStateChanged };

export type { User } from 'firebase/auth';
