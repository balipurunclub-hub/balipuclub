import { useEffect, useState } from 'react';
import { query, collection, onSnapshot, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Registration } from '@/types';

export function useRegistrations(constraints: QueryConstraint[] = []) {
  const [data, setData] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError('');

    try {
      const q = query(collection(db, 'registrations'), ...constraints);
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map(doc => ({
            ...doc.data(),
            uid: doc.id
          } as Registration));
          setData(docs);
          setLoading(false);
        },
        (err) => {
          console.error('Query error:', err);
          setError('Failed to fetch data');
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.error('Hook error:', err);
      setError('Setup failed');
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error('LocalStorage read failed:', error);
    }
    setIsReady(true);
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('LocalStorage write failed:', error);
    }
  };

  return [storedValue, setValue, isReady] as const;
}

export function usePagination<T>(data: T[], pageSize: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const currentData = data.slice(startIdx, endIdx);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  };

  const reset = () => setCurrentPage(1);

  return {
    currentPage,
    totalPages,
    currentData,
    goToPage,
    reset,
    canGoPrevious: currentPage > 1,
    canGoNext: currentPage < totalPages,
  };
}
