'use client';

import { useState, useEffect } from 'react';
import { ScannerRoute } from '@/components/ScannerRoute';
import { Scanner } from '@yudiel/react-qr-scanner';
import { CheckCircle2, AlertCircle, RefreshCw, Users, QrCode, X } from 'lucide-react';
import type { Registration } from '@/types';

type ScanStatus = 'idle' | 'scanning' | 'processing' | 'success' | 'error' | 'already_scanned';

export default function ScanPage() {
  const [manualId, setManualId] = useState('BRC-');
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

  // Poll live attendance count
  useEffect(() => {
    const fetchAttended = async () => {
      try {
        const res = await fetch(`/api/scan?attended=true&t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        const users: Registration[] = data.registrations || [];
        setLiveCount(typeof data.count === 'number' ? data.count : users.length);
        setScannedUsers(users);
      } catch (e) {
        console.error('Failed to fetch attended list', e);
      }
    };

    fetchAttended();
    const interval = setInterval(fetchAttended, 5000);
    return () => clearInterval(interval);
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
      
      let data: Registration | null = null;
      let actualDocId = '';

      const byTicketRes = await fetch(`/api/scan?ticketId=${encodeURIComponent(formattedId)}`);
      const byTicketData = await byTicketRes.json();
      if (!byTicketRes.ok) {
        throw new Error(byTicketData.error || 'Lookup failed');
      }

      const ticketMatches: Registration[] = byTicketData.registrations || [];
      if (ticketMatches.length > 0) {
        data = ticketMatches[0];
        actualDocId = data.uid;
      } else {
        // Fallback: Check if the scanned string is a document UID (for older PDF QR codes)
        try {
          const byIdRes = await fetch(`/api/scan?id=${encodeURIComponent(trimmedId)}`);
          const byIdData = await byIdRes.json();
          if (byIdRes.ok) {
            const idMatches: Registration[] = byIdData.registrations || [];
            if (idMatches.length > 0) {
              data = idMatches[0];
              actualDocId = data.uid;
            }
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
      let alreadyIn = !!data.attended;
      const linkedDocId = (data as Registration & { linkedDocId?: string }).linkedDocId;
      if (!alreadyIn && linkedDocId) {
        try {
          const linkedRes = await fetch(`/api/scan?id=${encodeURIComponent(linkedDocId)}`);
          const linkedData = await linkedRes.json();
          if (linkedRes.ok) {
            const linked: Registration | undefined = (linkedData.registrations || [])[0];
            if (linked?.attended) {
              alreadyIn = true;
            }
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
      const linkedDocId = (scannedUser.data as Registration & { linkedDocId?: string }).linkedDocId;
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scannedUser.docId,
          ...(linkedDocId ? { linkedDocId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update record');
      
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
    const id = manualId.trim().toUpperCase();
    if (!id || id === 'BRC-' || id === 'BRC-MR-') return;
    processTicket(manualId);
  };

  const resetScanner = () => {
    setStatus('scanning');
    setMessage('');
    setManualId('BRC-');
    setAttendeeName('');
    setScannedUser(null);
  };

  return (
    <ScannerRoute>
      <div className="min-h-screen bg-black pt-24 pb-12 px-3 sm:px-4 flex flex-col items-center relative overflow-x-clip">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,45,135,0.12),_transparent_55%)]"
          aria-hidden
        />

        <div className="relative w-full max-w-md mb-6 min-w-0">
          <p className="text-[#FF2D87] text-[0.65rem] font-semibold tracking-[0.25em] uppercase mb-2 text-center">
            Balipu Run Club
          </p>
          <h1 className="font-heading text-white uppercase tracking-wide text-2xl text-center mb-4">
            Ticket Scanner
          </h1>
          <div className="bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-2xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#FF2D87]/15 border border-[#FF2D87]/30 rounded-full flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF2D87]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-[10px] font-bold text-white/45 uppercase tracking-[0.2em] break-words">
                  Live Check-ins
                </h2>
                <p className="font-heading text-[#FF2D87] text-3xl tracking-wide">{liveCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-md bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-3xl overflow-hidden flex flex-col min-w-0">
          <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 min-w-0">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 min-w-0">
              <QrCode className="w-5 h-5 text-[#FF2D87] shrink-0" />
              <span className="break-words">Camera</span>
            </h2>
            <button
              onClick={() => setScannerKey((prev) => prev + 1)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/60 border border-white/15 min-h-11 px-3 py-1.5 rounded-full hover:border-[#FF2D87]/40 hover:text-white transition-colors"
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
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0a0a0a]">
                {status === 'processing' && (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="w-12 h-12 text-[#FF2D87] animate-spin mb-4" />
                    <p className="text-lg font-medium text-white/80">{message}</p>
                  </div>
                )}

                {status === 'error' && (
                  <div className="flex flex-col items-center animate-fade-in-up w-full">
                    <div className="w-20 h-20 bg-red-500/15 border border-red-500/30 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-12 h-12 text-red-400" />
                    </div>
                    <h2 className="font-heading text-red-400 uppercase tracking-wide text-2xl mb-2">
                      Access Denied
                    </h2>
                    <p className="text-white/55 mb-6 px-4">{message}</p>
                    <button
                      onClick={resetScanner}
                      className="w-full max-w-[200px] min-h-11 rounded-full bg-[#FF2D87] hover:bg-[#ff4d9a] text-white font-semibold transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {status === 'already_scanned' && (
                  <div className="flex flex-col items-center animate-fade-in-up w-full">
                    <div className="w-20 h-20 bg-red-500/15 border border-red-500/30 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-12 h-12 text-red-400" />
                    </div>
                    <h2 className="font-heading text-red-400 uppercase tracking-wide text-2xl mb-2">
                      Already Checked In
                    </h2>
                    <p className="text-white/55 mb-6 px-4 font-mono break-all">
                      {scannedUser?.data?.ticketId}
                    </p>
                    <button
                      onClick={resetScanner}
                      className="w-full max-w-[200px] min-h-11 rounded-full bg-red-500 hover:bg-red-400 text-white font-semibold transition-colors"
                    >
                      Scan Next
                    </button>
                  </div>
                )}

                {status === 'success' && (
                  <div className="flex flex-col items-center text-center">
                    <p className="text-white/45">Complete the dialog…</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 border-t border-white/10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-3 text-center">
              Manual Entry Fallback
            </p>
            <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="BRC-001"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="flex-1 w-full min-w-0 text-center font-mono uppercase tracking-wider min-h-11 bg-black/50 border border-white/15 rounded-full px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF2D87]/60"
                disabled={status === 'processing'}
              />
              <button
                type="submit"
                disabled={
                  !manualId.trim() ||
                  ['BRC-', 'BRC-MR-'].includes(manualId.trim().toUpperCase()) ||
                  status === 'processing'
                }
                className="min-h-11 px-6 rounded-full border border-[#FF2D87] text-white font-semibold hover:bg-[#FF2D87]/10 transition-colors disabled:opacity-50"
              >
                Verify
              </button>
            </form>
          </div>
        </div>

        <div className="relative w-full max-w-md mt-6 bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-3xl overflow-hidden min-w-0">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-heading text-white uppercase tracking-wide text-sm">Recently Scanned</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {scannedUsers.length === 0 ? (
              <div className="p-6 text-center text-white/40 text-sm">No one checked in yet.</div>
            ) : (
              <ul className="divide-y divide-white/5">
                {scannedUsers.map((user) => (
                  <li
                    key={user.uid}
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors min-w-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-white break-words">{user.name}</p>
                      <p className="text-xs text-[#FF2D87]/80 font-mono mt-0.5 break-all">
                        {user.ticketId} {user.bibNumber ? `• BIB: ${user.bibNumber}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {status === 'success' && scannedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="bg-[#0a0a0a] border border-[#FF2D87]/30 rounded-3xl w-full max-w-md max-h-[min(100dvh-2rem,900px)] overflow-y-auto shadow-2xl animate-fade-in-up mx-auto my-auto min-w-0">
              <div className="relative p-4 sm:p-6 text-center border-b border-white/10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
                </div>

                <h2 className="font-heading text-white uppercase tracking-wide text-xl sm:text-2xl mb-1">
                  Valid Ticket
                </h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-2">
                  <p className="text-[#FF2D87] font-mono text-xs sm:text-sm break-all px-4">
                    {scannedUser.data.ticketId}
                  </p>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      scannedUser.data.entryType === 'free'
                        ? 'bg-white/10 text-white/50'
                        : 'bg-[#FF2D87]/15 text-[#FF2D87]'
                    }`}
                  >
                    {scannedUser.data.entryType === 'free' ? 'Free entry' : 'Paid entry'}
                  </span>
                </div>

                <button
                  onClick={resetScanner}
                  className="absolute top-4 right-4 inline-flex items-center justify-center min-h-11 min-w-11 p-2 text-white/40 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                  <div className="bg-black/50 p-3 rounded-xl border border-white/10 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1">Name</p>
                    <p className="font-semibold text-white break-words">{scannedUser.data.name}</p>
                  </div>
                  {scannedUser.data.entryType !== 'free' && (
                    <div className="bg-black/50 p-3 rounded-xl border border-white/10 min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1">
                        Jersey Size
                      </p>
                      <p className="font-semibold text-white">{scannedUser.data.jerseySize || 'N/A'}</p>
                    </div>
                  )}
                  <div className="bg-black/50 p-3 rounded-xl border border-white/10 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1">
                      Age / Gender
                    </p>
                    <p className="font-semibold text-white">
                      {scannedUser.data.age} • {scannedUser.data.gender}
                    </p>
                  </div>
                  <div className="bg-black/50 p-3 rounded-xl border border-white/10 col-span-2 sm:col-span-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1">City</p>
                    <p className="font-semibold text-white break-words">{scannedUser.data.city}</p>
                  </div>
                </div>

                <div className="mb-6 bg-[#FF2D87]/10 border border-[#FF2D87]/25 rounded-xl p-4 text-center">
                  <label className="block text-[10px] font-bold text-[#FF2D87]/80 uppercase tracking-[0.2em] mb-1">
                    Assigned BIB Number
                  </label>
                  <p className="font-heading text-[#FF2D87] text-4xl tracking-wide">
                    {scannedUser.data.bibNumber || 'None'}
                  </p>
                </div>

                <button
                  onClick={handleDone}
                  disabled={isUpdating}
                  className="w-full min-h-11 py-4 rounded-full bg-[#FF2D87] hover:bg-[#ff4d9a] text-white font-semibold text-lg transition-colors disabled:opacity-50"
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

