export const app = {} as any;
export const db = {
  _checkNotDeleted: function() {
    return this;
  },
  _repo: {
    intercept: function() {}
  },
  app: app,
  'type': 'firebase-realtime-database'
} as any;

export interface User {
  uid: string;
  isAnonymous: boolean;
}

export const auth = {
  currentUser: null as User | null,
};

const authListeners = new Set<(user: User | null) => void>();

export function onAuthStateChanged(authInstance: any, callback: (user: User | null) => void) {
  authListeners.add(callback);
  
  let user: User | null = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('loopietown_mock_user');
      if (stored) {
        user = JSON.parse(stored);
      }
    } catch {}
  }
  auth.currentUser = user;
  callback(user);
  
  return () => {
    authListeners.delete(callback);
  };
}

export async function signInAnonymously(authInstance: any) {
  const mockUser: User = {
    uid: 'mock_user_' + Math.random().toString(36).substring(2, 11),
    isAnonymous: true,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('loopietown_mock_user', JSON.stringify(mockUser));
  }
  auth.currentUser = mockUser;
  authListeners.forEach((cb) => cb(mockUser));
  return { user: mockUser };
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

function updatePathValue(tree: any, path: string, values: any) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) {
    return { ...tree, ...values };
  }
  let current = tree;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || current[part] === null || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  const lastKey = parts[parts.length - 1];
  if (!(lastKey in current) || current[lastKey] === null || typeof current[lastKey] !== 'object') {
    current[lastKey] = {};
  }
  current[lastKey] = { ...current[lastKey], ...values };
  return tree;
}

const listeners = new Set<{ path: string; callback: (snap: any) => void }>();

function loadDB() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('loopietown_mock_db') || '{}');
  } catch {
    return {};
  }
}

function saveDB(tree: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('loopietown_mock_db', JSON.stringify(tree));
  notifyListeners();
}

function notifyListeners() {
  const tree = loadDB();
  listeners.forEach((listener) => {
    const val = getPathValue(tree, listener.path);
    listener.callback({
      val: () => val,
      exists: () => val !== null && val !== undefined,
    });
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'loopietown_mock_db') {
      notifyListeners();
    }
  });
}

export function ref(dbInstance: any, path: string) {
  if (!dbInstance) {
    dbInstance = db;
  }
  return { 
    path,
    _path: {
      pieces: path.split('/').filter(Boolean),
      toString: () => path
    },
    _db: dbInstance
  };
}

export async function set(refObj: { path: string }, value: any) {
  const tree = loadDB();
  const newTree = setPathValue(tree, refObj.path, value);
  saveDB(newTree);
}

export async function update(refObj: { path: string }, values: any) {
  const tree = loadDB();
  const newTree = updatePathValue(tree, refObj.path, values);
  saveDB(newTree);
}

export async function remove(refObj: { path: string }) {
  const tree = loadDB();
  const newTree = setPathValue(tree, refObj.path, null);
  saveDB(newTree);
}

export function onValue(
  refObj: { path: string },
  callback: (snap: any) => void,
  cancelCallback?: () => void
) {
  const listener = { path: refObj.path, callback };
  listeners.add(listener);
  
  const tree = loadDB();
  const val = getPathValue(tree, refObj.path);
  callback({
    val: () => val,
    exists: () => val !== null && val !== undefined,
  });

  return () => {
    listeners.delete(listener);
  };
}