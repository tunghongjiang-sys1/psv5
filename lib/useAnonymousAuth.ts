// lib/useAnonymousAuth.ts
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { auth } from './firebaseConfig';

export function useAnonymousAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
      } else {
        // No user yet → sign in anonymously
        signInAnonymously(auth)
          .then((cred) => {
            setUser(cred.user);
            setLoading(false);
          })
          .catch((error) => {
            console.error('Anonymous sign-in error', error);
            setLoading(false);
          });
      }
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}