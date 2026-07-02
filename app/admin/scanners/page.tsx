'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdminRoute } from '@/components/AdminRoute';
import { Trash2, UserPlus, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ScannersPage() {
  const [scanners, setScanners] = useState<{ email: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState('');

  const fetchScanners = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'roles'));
      const data: { email: string; role: string }[] = [];
      querySnapshot.forEach((document) => {
        if (document.data().role === 'scanner') {
          data.push({ email: document.id, role: 'scanner' });
        }
      });
      setScanners(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch scanners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScanners();
  }, [fetchScanners]);

  const addScanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    
    const email = newEmail.trim().toLowerCase();
    
    try {
      await setDoc(doc(db, 'roles', email), {
        role: 'scanner',
        createdAt: new Date().toISOString()
      });
      setNewEmail('');
      fetchScanners();
    } catch (err) {
      console.error(err);
      setError('Failed to add scanner.');
    }
  };

  const removeScanner = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} as a scanner?`)) return;
    
    try {
      await deleteDoc(doc(db, 'roles', email));
      fetchScanners();
    } catch (err) {
      console.error(err);
      setError('Failed to remove scanner.');
    }
  };

  return (
    <AdminRoute>
      <div className="min-h-screen p-4 sm:p-8 pt-24 bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#1B1B4D]">Manage Scanners</h1>
              <p className="text-sm text-slate-500">Add or remove staff authorized to scan event tickets.</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-200">
              <ShieldAlert className="w-5 h-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <form onSubmit={addScanner} className="flex flex-col sm:flex-row gap-3 max-w-md">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="scanner@example.com"
                className="flex-1 form-input"
                required
              />
              <button type="submit" className="btn-primary py-2 whitespace-nowrap flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Scanner
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[300px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-slate-500">Loading...</td>
                  </tr>
                ) : scanners.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-slate-500">No scanners added yet.</td>
                  </tr>
                ) : (
                  scanners.map((scanner) => (
                    <tr key={scanner.email} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-700">{scanner.email}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => removeScanner(scanner.email)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Scanner"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
