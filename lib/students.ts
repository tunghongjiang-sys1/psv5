import { useState, useEffect } from 'react';

export interface StudentState {
  studentId: string;
  sessionId: string;
  studentName: string;
}

let globalState: StudentState = {
  studentId: '',
  sessionId: '',
  studentName: '',
};

const listeners = new Set<() => void>();

export const studentState = {
  get(): StudentState {
    return globalState;
  },
  set(state: Partial<StudentState>) {
    globalState = { ...globalState, ...state };
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  clear() {
    globalState = {
      studentId: '',
      sessionId: '',
      studentName: '',
    };
    listeners.forEach((l) => l());
  }
};

export function useStudentState() {
  const [state, setState] = useState<StudentState>(globalState);

  useEffect(() => {
    return studentState.subscribe(() => {
      setState({ ...globalState });
    });
  }, []);

  return state;
}
