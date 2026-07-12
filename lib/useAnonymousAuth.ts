
import { useEffect, useState } from 'react';
import { auth, onAuthStateChanged, signInAnonymously, User } from './firebaseConfig';

export function useAnonymousAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
      } else {

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