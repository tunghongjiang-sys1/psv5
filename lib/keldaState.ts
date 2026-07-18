import { useState, useEffect } from 'react';

export interface KeldaState {
  isUnlocked: boolean;
}

const STATE_KEY = 'loopietown.keldaState.v1';
const ROUTE_KEY = 'loopietown.keldaRoute.v1';

const EMPTY_STATE: KeldaState = {
  isUnlocked: false,
};

const safeGetItem = (key: string): string | null => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch {
    
  }
};

const safeRemoveItem = (key: string): void => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {
    
  }
};

const loadInitialState = (): KeldaState => {
  const raw = safeGetItem(STATE_KEY);
  if (!raw) return { ...EMPTY_STATE };
  try {
    const parsed = JSON.parse(raw);
    return {
      isUnlocked: Boolean(parsed?.isUnlocked),
    };
  } catch {
    return { ...EMPTY_STATE };
  }
};

let globalState: KeldaState = loadInitialState();

const listeners = new Set<() => void>();

export const keldaState = {
  get(): KeldaState {
    return globalState;
  },
  set(state: Partial<KeldaState>) {
    globalState = { ...globalState, ...state };
    safeSetItem(STATE_KEY, JSON.stringify(globalState));
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  clear() {
    globalState = { ...EMPTY_STATE };
    safeRemoveItem(STATE_KEY);
    safeRemoveItem(ROUTE_KEY);
    listeners.forEach((l) => l());
  },
  getLastRoute(): string {
    return safeGetItem(ROUTE_KEY) ?? '';
  },
  setLastRoute(route: string) {
    if (!route || !route.startsWith('/kelda/')) return;
    if (route === '/kelda/login') return;
    safeSetItem(ROUTE_KEY, route);
  },
};

export function useKeldaState() {
  const [state, setState] = useState<KeldaState>(globalState);

  useEffect(() => {
    return keldaState.subscribe(() => {
      setState({ ...globalState });
    });
  }, []);

  return state;
}
