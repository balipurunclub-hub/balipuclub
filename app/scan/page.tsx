'use client';

import { useState, useEffect } from 'react';
import { ScannerRoute } from '@/components/ScannerRoute';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, serverTimestamp, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Scanner } from '@yudiel/react-qr-scanner';
import { CheckCircle2, AlertCircle, RefreshCw, Users, QrCode, X } from 'lucide-react';
import type { Registration } from '@/types';

type ScanStatus = 'idle' | 'scanning' | 'processing' | 'success' | 'error' | 'already_scanned';

export default function ScanPage() {
  const [manualId, setManualId] = useState('BRC-MR-');
  const [status, setStatus] = useState<ScanStatus>('scanning');
  const [message, setMessage] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [liveCount, setLiveCount] = useState(0);
  const [scannedUsers, setScannedUsers] = useState<Registration[]>([]);
  
  // New states for the dialog
  const [scannedUser, setScannedUser] = useState<{data: Registration, docId: string} | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  
  // Remote Scanner Access Controls
  const [allowFree, setAllowFree] = useState(true);
  const [allowPaid, setAllowPaid] = useState(true);

  // Poll remote scanner access controls
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/admin/scanner-settings?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setAllowFree(data.allowFreeTierScan !== false); // default to true if undefined
          setAllowPaid(data.allowPaidTierScan !== false);
        }
      } catch (e) {
        console.error("Failed to fetch scanner settings", e);
      }
    };

    fetchSettings();
    const interval = setInterval(fetchSettings, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  // Listen to live attendance count
  useEffect(() => {
    const q = query(
      collection(db, 'registrations'),
      where('paymentStatus', '==', 'paid'),
      where('attended', '==', true)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLiveCount(snapshot.size);
      
      const users = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as Registration));
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

  // Prevent accidental back-swipe or reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handlePopState = () => {
      // Push state again to trap the user
      window.history.pushState(null, '', window.location.href);
    };

    // Push initial trap state
    window.history.pushState(null, '', window.location.href);

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const processTicket = async (ticketId: string) => {
    if (!ticketId || status === 'processing') return;
    
    setStatus('processing');
    setMessage('Verifying ticket...');
    setAttendeeName('');
    setScannedUser(null);

    try {
      const trimmedId = ticketId.trim();
      const formattedId = trimmedId.toUpperCase();
      
      const q = query(
        collection(db, 'registrations'),
        where('ticketId', '==', formattedId)
      );
      
      const querySnapshot = await getDocs(q);
      
      let data: Registration | null = null;
      let actualDocId = '';

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0];
        data = docRef.data() as Registration;
        actualDocId = docRef.id;
      } else {
        // Fallback: Check if the scanned string is a document UID (for older PDF QR codes)
        try {
          const fallbackDocRef = doc(db, 'registrations', trimmedId);
          const fallbackSnap = await getDoc(fallbackDocRef);
          if (fallbackSnap.exists()) {
            data = fallbackSnap.data() as Registration;
            actualDocId = fallbackSnap.id;
          }
        } catch (e) {
          console.log("Fallback check failed", e);
        }
      }
      
      if (!data) {
        setStatus('error');
        setMessage(`Invalid Ticket ID: ${formattedId} not found.`);
        return;
      }
      
      setAttendeeName(data.name);

      if (data.paymentStatus !== 'paid') {
        setStatus('error');
        setMessage(`Payment not completed (Status: ${data.paymentStatus})`);
        return;
      }

      // Check remote toggle states
      if (data.entryType === 'free' && !allowFree) {
        setStatus('error');
        setMessage(`Free Tier scanning is currently disabled. Please come back later!`);
        return;
      }
      
      if (data.entryType !== 'free' && !allowPaid) {
        setStatus('error');
        setMessage(`Paid Tier scanning is currently disabled. Please come back later!`);
        return;
      }

      // Prepare user data for dialog
      setScannedUser({ data, docId: actualDocId });

      // Check if this doc OR its linked duplicate is already checked in
      let alreadyIn = data.attended;
      if (!alreadyIn && (data as any).linkedDocId) {
        try {
          const linkedSnap = await getDoc(doc(db, 'registrations', (data as any).linkedDocId));
          if (linkedSnap.exists() && linkedSnap.data()?.attended) {
            alreadyIn = true;
          }
        } catch (_) {}
      }

      if (alreadyIn) {
        setStatus('already_scanned');
        setMessage(`Already Checked In!`);
        return;
      }

      setStatus('success');
      setMessage('Ticket Valid!');
      
    } catch (err) {
      console.error("Scan error:", err);
      setStatus('error');
      setMessage('A network error occurred. Please try again.');
    }
  };

  const handleDone = async () => {
    if (!scannedUser) return;

    setIsUpdating(true);
    try {
      const docRef = doc(db, 'registrations', scannedUser.docId);
      
      const updateData: any = {
        attended: true,
      };
      
      if (!scannedUser.data.attended) {
         updateData.attendedAt = serverTimestamp();
      }

      await updateDoc(docRef, updateData);

      // Also mark the linked duplicate as attended (if any)
      const linkedId = (scannedUser.data as any).linkedDocId;
      if (linkedId) {
        try {
          const linkedRef = doc(db, 'registrations', linkedId);
          await updateDoc(linkedRef, { attended: true, attendedAt: serverTimestamp() });
        } catch (e) {
          console.warn('Failed to update linked doc:', e);
        }
      }
      
      resetScanner();
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update record. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim().toUpperCase() === 'BRC-MR-') return;
    processTicket(manualId);
  };

  const resetScanner = () => {
    setStatus('scanning');
    setMessage('');
    setManualId('BRC-MR-');
    setAttendeeName('');
    setScannedUser(null);
  };

  return (
    <ScannerRoute>
      <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4 flex flex-col items-center relative">
        
        {/* Live Count Header */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl px-6 py-4 flex items-center justify-between gap-4 mb-8 w-full max-w-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Live Check-ins</h2>
              <p className="text-3xl font-heading text-[#1B1B4D]">{liveCount}</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col">
          
          <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#1B1B4D] flex items-center gap-2">
              <QrCode className="w-5 h-5" /> Ticket Scanner
            </h1>
            <button 
              onClick={() => setScannerKey(prev => prev + 1)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
              title="Click this if the camera freezes"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Wake
            </button>
          </div>

          <div className="flex-1 relative bg-black aspect-square max-h-[400px]">
            {status === 'scanning' && (
              <Scanner
                key={scannerKey}
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

                {status === 'already_scanned' && (
                  <div className="flex flex-col items-center animate-fade-in-up w-full">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-3xl font-black text-red-600 uppercase mb-2">Already<br/>Checked In!</h2>
                    <p className="text-slate-600 mb-6 px-4 font-mono">{scannedUser?.data?.ticketId}</p>
                    <button onClick={resetScanner} className="btn-primary w-full max-w-[200px] bg-red-500 hover:bg-red-600">Scan Next</button>
                  </div>
                )}

                {/* Floating Dialog logic handled via an overlay below, so here we just show a placeholder if we are holding state */}
                {status === 'success' && (
                  <div className="flex flex-col items-center text-center">
                    <p className="text-slate-500">Please complete the dialog...</p>
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
                disabled={!manualId.trim() || manualId.trim().toUpperCase() === 'BRC-MR-' || status === 'processing'}
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
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{user.ticketId} {user.bibNumber ? `• BIB: ${user.bibNumber}` : ''}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Floating Dialog Modal */}
        {status === 'success' && scannedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up mx-2">
              <div className="relative p-4 sm:p-6 text-center border-b border-slate-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                </div>
                
                <h2 className="text-xl sm:text-2xl font-bold text-[#1B1B4D] mb-1">Valid Ticket!</h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-2">
                  <p className="text-slate-500 font-mono text-xs sm:text-sm break-all px-4">{scannedUser.data.ticketId}</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${scannedUser.data.entryType === 'free' ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-600'}`}>
                    {scannedUser.data.entryType === 'free' ? 'FREE ENTRY' : 'PAID ENTRY'}
                  </span>
                </div>
                
                <button 
                  onClick={resetScanner}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 bg-slate-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Name</p>
                    <p className="font-semibold text-slate-800 break-words">{scannedUser.data.name}</p>
                  </div>
                  {scannedUser.data.entryType !== 'free' && (
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Jersey Size</p>
                      <p className="font-semibold text-slate-800">{scannedUser.data.jerseySize || 'N/A'}</p>
                    </div>
                  )}
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Age / Gender</p>
                    <p className="font-semibold text-slate-800">{scannedUser.data.age} • {scannedUser.data.gender}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 col-span-2 sm:col-span-1">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">City</p>
                    <p className="font-semibold text-slate-800 break-words">{scannedUser.data.city}</p>
                  </div>
                </div>

                <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
                  <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Assigned BIB Number</label>
                  <p className="text-4xl font-black text-[#1B1B4D]">
                    {scannedUser.data.bibNumber || 'None'}
                  </p>
                </div>

                <button 
                  onClick={handleDone} 
                  disabled={isUpdating}
                  className="btn-primary w-full py-4 text-lg"
                >
                  {isUpdating ? 'Saving...' : 'Done'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ScannerRoute>
  );
}
