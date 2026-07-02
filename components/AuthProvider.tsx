'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  getRedirectResult,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isScanner: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  isAdmin: false,
  isScanner: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScanner, setIsScanner] = useState(false);

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';

  useEffect(() => {
    let redirectFinished = false;
    let authStateFired = false;

    // Process any pending redirect results (from signInWithRedirect)
    getRedirectResult(auth)
      .catch(console.error)
      .finally(() => {
        redirectFinished = true;
        if (authStateFired) {
          setLoading(false);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser && firebaseUser.email) {
        try {
          const roleDoc = await getDoc(doc(db, 'roles', firebaseUser.email.toLowerCase()));
          if (roleDoc.exists() && roleDoc.data().role === 'scanner') {
            setIsScanner(true);
          } else {
            setIsScanner(false);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setIsScanner(false);
        }
      } else {
        setIsScanner(false);
      }
      
      authStateFired = true;
      if (redirectFinished) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const isAdmin = !!user && !!user.email && user.email.toLowerCase() === adminEmail.toLowerCase();

  return (
    <AuthContext.Provider value={{ user, loading, signOut, isAdmin, isScanner }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
