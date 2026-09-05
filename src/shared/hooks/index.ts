import { useEffect, useState } from 'react';
import type { Registration } from '@/types';

export function useRegistrations() {
  const [data, setData] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError('');
        const res = await fetch('/api/admin/registrations', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch data');
        if (!cancelled) {
          setData(json.registrations || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Query error:', err);
        if (!cancelled) {
          setError('Failed to fetch data');
          setLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
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
