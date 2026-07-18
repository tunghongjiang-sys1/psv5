import {useState, useEffect} from 'react';

export interface StudentState {
  studentId: string;
  sessionId: string;
  studentName: string;
}

const stateKey = 'loopietown.studentState.v1';
const routeKey = 'loopietown.lastRoute.v1';

const emptyState: StudentState = {
  studentId: '',
  sessionId: '',
  studentName: '',
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
  } catch {}
};

const safeRemoveItem = (key: string): void => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {}
};

const loadInitialState = (): StudentState => {
  const raw = safeGetItem(stateKey);
  if (!raw) return {...emptyState};
  try {
    const parsed = JSON.parse(raw);
    return {
      studentId: String(parsed?.studentId ?? ''),
      sessionId: String(parsed?.sessionId ?? ''),
      studentName: String(parsed?.studentName ?? ''),
    };
  } catch {
    return {...emptyState};
  }
};

let globalState: StudentState = loadInitialState();

const listeners = new Set<() => void>();

export const studentState = {
  get(): StudentState {
    return globalState;
  },
  set(state: Partial<StudentState>) {
    globalState = {...globalState, ...state};
    safeSetItem(stateKey, JSON.stringify(globalState));
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  clear() {
    globalState = {...emptyState};
    safeRemoveItem(stateKey);
    safeRemoveItem(routeKey);
    listeners.forEach((l) => l());
  },
  getLastRoute(): string {
    return safeGetItem(routeKey) ?? '';
  },
  setLastRoute(route: string) {
    if (!route || !route.startsWith('/student/')) return;
    if (route === '/student/name') return;
    safeSetItem(routeKey, route);
  },
};

export function useStudentState() {
  const [state, setState] = useState<StudentState>(globalState);

  useEffect(() => {
    return studentState.subscribe(() => {
      setState({...globalState});
    });
  }, []);

  return state;
}
