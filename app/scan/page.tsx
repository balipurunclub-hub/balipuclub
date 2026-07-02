'use client';

import { useState, useEffect } from 'react';
import { ScannerRoute } from '@/components/ScannerRoute';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { Scanner } from '@yudiel/react-qr-scanner';
import { CheckCircle2, AlertCircle, RefreshCw, Users, QrCode } from 'lucide-react';
import type { Registration } from '@/types';

type ScanStatus = 'idle' | 'scanning' | 'processing' | 'success' | 'error' | 'already_scanned';

export default function ScanPage() {
  const [manualId, setManualId] = useState('');
  const [status, setStatus] = useState<ScanStatus>('scanning');
  const [message, setMessage] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [liveCount, setLiveCount] = useState(0);
  const [scannedUsers, setScannedUsers] = useState<Registration[]>([]);

  // Listen to live attendance count
  useEffect(() => {
    const q = query(
      collection(db, 'registrations'),
      where('paymentStatus', '==', 'paid'),
      where('attended', '==', true)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLiveCount(snapshot.size);
      
      const users = snapshot.docs.map(doc => doc.data() as Registration);
      // Sort by most recently attended
      users.sort((a, b) => {
        const timeA = a.attendedAt?.toMillis() || 0;
        const timeB = b.attendedAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setScannedUsers(users);
    });
    
    return () => unsubscribe();
  }, []);

  const processTicket = async (ticketId: string) => {
    if (!ticketId || status === 'processing') return;
    
    setStatus('processing');
    setMessage('Verifying ticket...');
    setAttendeeName('');

    try {
      const formattedId = ticketId.trim().toUpperCase();
      
      const q = query(
        collection(db, 'registrations'),
        where('ticketId', '==', formattedId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setStatus('error');
        setMessage(`Invalid Ticket ID: ${formattedId} not found.`);
        return;
      }
      
      const docRef = querySnapshot.docs[0];
      const data = docRef.data() as Registration;
      setAttendeeName(data.name);

      if (data.paymentStatus !== 'paid') {
        setStatus('error');
        setMessage(`Payment not completed (Status: ${data.paymentStatus})`);
        return;
      }

      if (data.attended) {
        setStatus('already_scanned');
        setMessage(`Already Checked In!`);
        return;
      }

      // Mark as attended
      await updateDoc(docRef.ref, {
        attended: true,
        attendedAt: serverTimestamp()
      });

      setStatus('success');
      setMessage('Successfully Checked In!');
      
      // Auto-reset after 3 seconds on success
      setTimeout(() => {
        resetScanner();
      }, 3000);
      
    } catch (err) {
      console.error("Scan error:", err);
      setStatus('error');
      setMessage('A network error occurred. Please try again.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processTicket(manualId);
  };

  const resetScanner = () => {
    setStatus('scanning');
    setMessage('');
    setManualId('');
    setAttendeeName('');
  };

  return (
    <ScannerRoute>
      <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4 flex flex-col items-center">
        
        {/* Live Count Header */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl px-6 py-4 flex items-center gap-4 mb-8 w-full max-w-md">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Live Check-ins</h2>
            <p className="text-3xl font-heading text-[#1B1B4D]">{liveCount}</p>
          </div>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
          
          <div className="p-6 text-center border-b border-slate-100 bg-slate-50/50">
            <h1 className="text-xl font-bold text-[#1B1B4D] flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5" /> Ticket Scanner
            </h1>
          </div>

          <div className="flex-1 relative bg-black aspect-square max-h-[400px]">
            {status === 'scanning' && (
              <Scanner
                onScan={(result) => {
                  if (result && result.length > 0) {
                     processTicket(result[0].rawValue);
                  }
                }}
                onError={(error) => {
                  console.error(error);
                }}
                components={{
                  finder: true,
                }}
              />
            )}

            {status !== 'scanning' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white">
                {status === 'processing' && (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                    <p className="text-lg font-medium text-slate-700">{message}</p>
                  </div>
                )}
                
                {status === 'success' && (
                  <div className="flex flex-col items-center animate-fade-in-up">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-green-600 mb-1">Approved!</h2>
                    <p className="text-lg font-medium text-slate-800">{attendeeName}</p>
                    <p className="text-slate-500 mb-6">{message}</p>
                  </div>
                )}

                {status === 'already_scanned' && (
                  <div className="flex flex-col items-center animate-fade-in-up">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-12 h-12 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-yellow-600 mb-1">Warning</h2>
                    <p className="text-lg font-medium text-slate-800">{attendeeName}</p>
                    <p className="text-slate-600 mb-6">{message}</p>
                    <button onClick={resetScanner} className="btn-primary w-full max-w-[200px]">Scan Next</button>
                  </div>
                )}

                {status === 'error' && (
                  <div className="flex flex-col items-center animate-fade-in-up w-full">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
                    <p className="text-slate-600 mb-6 px-4">{message}</p>
                    <button onClick={resetScanner} className="btn-primary w-full max-w-[200px]">Try Again</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Manual Entry Fallback</p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="BRC-MR-XXXX"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="flex-1 form-input text-center font-mono uppercase tracking-wider"
                disabled={status === 'processing'}
              />
              <button 
                type="submit" 
                disabled={!manualId.trim() || status === 'processing'}
                className="btn-secondary px-6 disabled:opacity-50"
              >
                Verify
              </button>
            </form>
          </div>
        </div>

        {/* Recently Scanned List */}
        <div className="w-full max-w-md mt-6 bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">Recently Scanned</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {scannedUsers.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">No one checked in yet.</div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {scannedUsers.map(user => (
                  <li key={user.uid} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-medium text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{user.ticketId}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </ScannerRoute>
  );
}
