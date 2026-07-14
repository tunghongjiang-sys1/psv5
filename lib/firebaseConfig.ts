import {
  initializeApp,
  getApps,
  type FirebaseApp,
} from 'firebase/app';
import {
  getDatabase,
  ref as fbRef,
  set as fbSet,
  update as fbUpdate,
  remove as fbRemove,
  onValue as fbOnValue,
  type Database,
  type DatabaseReference,
} from 'firebase/database';
import {
  getAuth,
  onAuthStateChanged as fbOnAuthStateChanged,
  signInAnonymously as fbSignInAnonymously,
  type Auth,
  type User as FbUser,
} from 'firebase/auth';

export interface User {
  uid: string;
  isAnonymous: boolean;
}

export type FirebaseUser = FbUser;

const envConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const hasRealConfig = Boolean(
  envConfig.apiKey &&
    envConfig.databaseURL &&
    envConfig.projectId &&
    envConfig.appId
);

let warnedAboutMissingConfig = false;
function warnMissingConfigOnce() {
  if (warnedAboutMissingConfig) return;
  warnedAboutMissingConfig = true;
  if (typeof console !== 'undefined') {
    console.warn(
      '[firebaseConfig] Missing EXPO_PUBLIC_FIREBASE_* env vars. Falling back to local-only mock — multi-device sync will NOT work. See .env.example for the template.'
    );
  }
}

let fbApp: FirebaseApp | null = null;
let fbDatabase: Database | null = null;
let fbAuth: Auth | null = null;

if (hasRealConfig && typeof window !== 'undefined') {
  try {
    fbApp = getApps().length ? getApps()[0] : initializeApp(envConfig);
    fbDatabase = getDatabase(fbApp);
    fbAuth = getAuth(fbApp);
  } catch (e) {
    if (typeof console !== 'undefined') {
      console.warn('[firebaseConfig] Firebase init failed, falling back to mock:', e);
    }
    fbApp = null;
    fbDatabase = null;
    fbAuth = null;
  }
} else if (!hasRealConfig) {
  warnMissingConfigOnce();
}

function getPathValue(tree: any, path: string) {
  const parts = path.split('/').filter(Boolean);
  let current = tree;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return null;
    }
    current = current[part];
  }
  return current ?? null;
}

function setPathValue(tree: any, path: string, value: any) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return value;
  let current = tree;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || current[part] === null || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  const lastKey = parts[parts.length - 1];
  if (value === null) {
    delete current[lastKey];
  } else {
    current[lastKey] = value;
  }
  return tree;
}

const mockListeners = new Set<{ path: string; callback: (snap: any) => void }>();
const mockAuthListeners = new Set<(user: User | null) => void>();
let mockCurrentUser: User | null = null;

function loadMockDB() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('loopietown_mock_db') || '{}');
  } catch {
    return {};
  }
}

function saveMockDB(tree: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('loopietown_mock_db', JSON.stringify(tree));
  notifyMockListeners();
}

function notifyMockListeners() {
  const tree = loadMockDB();
  mockListeners.forEach((listener) => {
    const val = getPathValue(tree, listener.path);
    listener.callback({
      val: () => val,
      exists: () => val !== null && val !== undefined,
    });
  });
}

function loadMockUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('loopietown_mock_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setMockUser(user: User | null) {
  mockCurrentUser = user;
  if (typeof window !== 'undefined') {
    if (user === null) {
      localStorage.removeItem('loopietown_mock_user');
    } else {
      localStorage.setItem('loopietown_mock_user', JSON.stringify(user));
    }
  }
  mockAuthListeners.forEach((cb) => cb(user));
}

if (typeof window !== 'undefined') {
  mockCurrentUser = loadMockUser();
}

export const app = (fbApp ?? ({} as FirebaseApp)) as FirebaseApp;

export const db = (fbDatabase ?? ({} as Database)) as Database;

export const auth = fbAuth
  ? (fbAuth as Auth)
  : ({
      get currentUser(): User | null {
        if (mockCurrentUser === null && typeof window !== 'undefined') {
          mockCurrentUser = loadMockUser();
        }
        return mockCurrentUser;
      },
    } as unknown as Auth);

export function ref(dbInstance: any, path: string) {
  if (fbDatabase) {
    return fbRef((dbInstance ?? fbDatabase) as Database, path);
  }
  return {
    path,
    _path: {
      pieces: path.split('/').filter(Boolean),
      toString: () => path,
    },
    _db: dbInstance ?? db,
  };
}

export async function set(refObj: { path: string } | DatabaseReference, value: any) {
  if (fbDatabase) {
    return fbSet(refObj as DatabaseReference, value);
  }
  const path = (refObj as { path: string }).path;
  const tree = loadMockDB();
  const next = setPathValue(tree, path, value);
  saveMockDB(next);
}

export async function update(refObj: { path: string } | DatabaseReference, values: any) {
  if (fbDatabase) {
    return fbUpdate(refObj as DatabaseReference, values);
  }
  const path = (refObj as { path: string }).path;
  const tree = loadMockDB();
  let next = tree;
  for (const [key, value] of Object.entries(values || {})) {
    const fullPath = path ? `${path}/${key}` : key;
    next = setPathValue(next, fullPath, value);
  }
  saveMockDB(next);
}

export async function remove(refObj: { path: string } | DatabaseReference) {
  if (fbDatabase) {
    return fbRemove(refObj as DatabaseReference);
  }
  const path = (refObj as { path: string }).path;
  const tree = loadMockDB();
  const next = setPathValue(tree, path, null);
  saveMockDB(next);
}

export function onValue(
  refObj: { path: string } | DatabaseReference,
  callback: (snap: any) => void,
  cancelCallback?: () => void
) {
  if (fbDatabase) {
    return fbOnValue(refObj as DatabaseReference, callback, cancelCallback);
  }
  const path = (refObj as { path: string }).path;
  const listener = { path, callback };
  mockListeners.add(listener);
  const tree = loadMockDB();
  const val = getPathValue(tree, path);
  callback({
    val: () => val,
    exists: () => val !== null && val !== undefined,
  });
  return () => {
    mockListeners.delete(listener);
  };
}

export function onAuthStateChanged(
  authInstance: any,
  callback: (user: User | null) => void
) {
  mockAuthListeners.add(callback);

  if (fbAuth) {
    return fbOnAuthStateChanged(fbAuth as Auth, (fbUser) => {
      const wrapped: User | null = fbUser
        ? { uid: fbUser.uid, isAnonymous: fbUser.isAnonymous }
        : null;
      callback(wrapped);
    });
  }

  if (typeof window !== 'undefined') {
    mockCurrentUser = loadMockUser();
  }
  callback(mockCurrentUser);

  return () => {
    mockAuthListeners.delete(callback);
  };
}

export async function signInAnonymously(authInstance: any) {
  if (fbAuth) {
    const cred = await fbSignInAnonymously(fbAuth as Auth);
    return {
      user: {
        uid: cred.user.uid,
        isAnonymous: cred.user.isAnonymous,
      } as User,
    };
  }
  const user: User = {
    uid: 'mock_user_' + Math.random().toString(36).substring(2, 11),
    isAnonymous: true,
  };
  setMockUser(user);
  return { user };
}

export const usingRealFirebase = hasRealConfig && fbDatabase !== null;
