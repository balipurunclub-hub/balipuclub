'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { AdminRoute } from '@/components/AdminRoute';

export default function ScannerControlsPage() {
  const [allowFree, setAllowFree] = useState(true);
  const [allowPaid, setAllowPaid] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/admin/scanner-settings?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setAllowFree(data.allowFreeTierScan !== false);
          setAllowPaid(data.allowPaidTierScan !== false);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const toggleFree = async () => {
    const newVal = !allowFree;
    setAllowFree(newVal);
    await fetch('/api/admin/scanner-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowFreeTierScan: newVal })
    });
  };

  const togglePaid = async () => {
    const newVal = !allowPaid;
    setAllowPaid(newVal);
    await fetch('/api/admin/scanner-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowPaidTierScan: newVal })
    });
  };

  if (loading) return (
    <AdminRoute>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading controls...</p>
      </div>
    </AdminRoute>
  );

  return (
    <AdminRoute>
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-8">
          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-[#1B1B4D]">Scanner Access Controls</h1>
              <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                Instantly enable or disable ticket scanning for specific tiers. Changes apply to all active scanners in real-time.
              </p>
            </div>
            
            <div className="p-8 space-y-6">
              
              {/* Paid Tier Toggle */}
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Paid Tier Scanning</h3>
                  <p className="text-slate-500 text-sm mt-1">Allow Paid entry tickets to be checked in.</p>
                </div>
                <button 
                  onClick={togglePaid}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${allowPaid ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${allowPaid ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Free Tier Toggle */}
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Free Tier Scanning</h3>
                  <p className="text-slate-500 text-sm mt-1">Allow Free entry tickets to be checked in.</p>
                </div>
                <button 
                  onClick={toggleFree}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${allowFree ? 'bg-green-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${allowFree ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </AdminRoute>
  );
}
