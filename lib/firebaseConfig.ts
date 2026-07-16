// Real Firebase initialization for the Loopie Town Expo Router app.
//
// This file wires the Firebase v9 modular SDK for project `ps-d-228ec`
// (Realtime Database in region `asia-southeast1`). Once init succeeds,
// every call site that imports `db`, `auth`, `ref`, `set`, `update`,
// `remove`, `onValue`, `signInAnonymously`, `onAuthStateChanged`, or the
// `User` type from this module talks to the real, multi-device
// Realtime Database — so when the teacher starts a session on their
// device, every subscribed student device picks it up.
//
// Cross-device sync requirements (one-time setup in Firebase console):
//   1. Build → Realtime Database → Create (region: asia-southeast1,
//      start in test mode).
//   2. Build → Authentication → Sign-in method → enable Anonymous.
//   3. Realtime Database → Rules tab → paste:
//        {
//          "rules": {
//            ".read":  "auth != null",
//            ".write": "auth != null"
//          }
//        }
//      then Publish.
//   4. Restart Expo with `npx expo start -c` so Metro reloads.

import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
} from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, type Auth } from 'firebase/auth';

import {
  ref,
  set,
  update,
  remove,
  onValue,
} from 'firebase/database';
import {
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';

// Firebase Web App config (from Firebase console → Project settings →
// General → Your apps → </>). `databaseURL` points at the regional
// RTDB instance in `asia-southeast1` so the SDK avoids the default
// us-central1 host.
const firebaseConfig = {
  apiKey: 'AIzaSyCtbS05D9qXpHJk54z5v3iADl4NWojXXlQ',
  authDomain: 'ps-d-228ec.firebaseapp.com',
  databaseURL:
    'https://ps-d-228ec-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'ps-d-228ec',
  storageBucket: 'ps-d-228ec.firebasestorage.app',
  messagingSenderId: '144746123825',
  appId: '1:144746123825:web:c85ab22fffe5f907babb10',
  // `measurementId` is intentionally omitted — Analytics is not enabled
  // and pulling in `firebase/analytics` is unstable on React Native.
};

const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export { app };
export const db: Database = getDatabase(app);
export const auth: Auth = getAuth(app);

// Re-exports of the database + auth primitives every call site
// consumes. These are direct pass-throughs to the real Firebase SDK
// (no mock wrapper), so the API surface is identical to the modular
// SDK's exported names.
export { ref, set, update, remove, onValue };
export { signInAnonymously, onAuthStateChanged };

// Re-export the real Firebase `User` type to replace the previously
// hand-rolled local `User`, so existing callers (e.g.
// `useAnonymousAuth.ts`) continue to `import { User } from
// './firebaseConfig'` unchanged.
export type { User } from 'firebase/auth';
