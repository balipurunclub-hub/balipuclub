'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AdminRoute } from '@/components/AdminRoute';
import { Mail, MapPin, Calendar, Clock, Link as LinkIcon, RefreshCw, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';
import type { Registration } from '@/types';

export default function SendEmailsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [isMailing, setIsMailing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isTesting, setIsTesting] = useState(false);
  const [mailSuccess, setMailSuccess] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('jeetheshkarate@gmail.com');
  const [sendToAll, setSendToAll] = useState(false);
  
  // Mail template fields
  const [mailDate, setMailDate] = useState('10th July 2026');
  const [mailTime, setMailTime] = useState('');
  const [mailLocation, setMailLocation] = useState('Decathlon Sports - 1st floor, Bharath Mall, Bejai Kavoor Rd, opposite KSRTC, Lalbagh, Mangaluru, Karnataka 575004');
  const [mailMapsLink, setMailMapsLink] = useState('https://maps.app.goo.gl/hacfPsQE4KWpT3re6');
  const [mailRouteLink, setMailRouteLink] = useState('https://maps.app.goo.gl/WuC7oC5PWhyZ5n9o9');
  const [mailRouteImage, setMailRouteImage] = useState('map.jpeg');

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const q = query(collection(db, 'registrations'));
      const querySnapshot = await getDocs(q);
      const data: Registration[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ uid: doc.id, ...doc.data() } as Registration);
      });
      setRegistrations(data);
    } catch (err) {
      console.error(err);
      setFetchError('Failed to fetch registrations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const targetUsers = registrations.filter(r => sendToAll ? true : !r.emailSent);

  const handleSendTestMail = async () => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/admin/bulk-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: [{
            name: 'Test Runner',
            email: testEmailAddress,
            ticketId: 'BRC-MR-TEST',
            bibNumber: 999,
            jerseySize: 'L',
            entryType: 'paid'
          }],
          mailDate,
          mailTime,
          mailLocation,
          mailMapsLink,
          mailRouteLink,
          mailRouteImage
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send test email');
      
      alert(`Test email sent successfully to ${testEmailAddress}!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendBulkMail = async () => {
    if (targetUsers.length === 0) {
      alert('No users selected to receive emails.');
      return;
    }
    
    if (!confirm(`Are you sure you want to send emails to ${targetUsers.length} users?`)) {
      return;
    }

    setIsMailing(true);
    setMailSuccess(false);
    setProgress({ current: 0, total: targetUsers.length });
    
    const BATCH_SIZE = 10;
    let sentSoFar = 0;

    try {
      for (let i = 0; i < targetUsers.length; i += BATCH_SIZE) {
        const batch = targetUsers.slice(i, i + BATCH_SIZE);
        
        const res = await fetch('/api/admin/bulk-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            users: batch,
            mailDate,
            mailTime,
            mailLocation,
            mailMapsLink,
            mailRouteLink,
            mailRouteImage
          })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send emails');
        
        sentSoFar += batch.length;
        setProgress({ current: sentSoFar, total: targetUsers.length });
      }
      
      setMailSuccess(true);
      // Re-fetch to update the emailSent status locally
      fetchRegistrations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsMailing(false);
    }
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-[#0D0D2B] pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-white mb-2">Send Bulk Emails</h1>
              <p className="text-slate-400">Configure and send the BIB collection email to your participants.</p>
            </div>
            <Link href="/admin" className="text-[#F5841F] hover:underline font-semibold">
              &larr; Back to Admin
            </Link>
          </div>

          {fetchError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {fetchError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Column: Target Audience */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-[#1B1B4D] border border-white/10 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#F5841F]" />
                  Recipients
                </h2>
                
                {loading ? (
                  <div className="text-slate-400 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Loading users...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                      <div className="text-3xl font-bold text-white mb-1">{targetUsers.length}</div>
                      <div className="text-sm text-slate-400">Target Users</div>
                    </div>
                    
                    <div className="flex items-start gap-2 mt-4 text-sm text-slate-300 bg-white/5 p-3 rounded-lg border border-white/10">
                      <input 
                        type="checkbox" 
                        id="sendToAll" 
                        checked={sendToAll} 
                        onChange={(e) => setSendToAll(e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-[#F5841F] bg-[#0D0D2B] border-white/20 rounded focus:ring-[#F5841F] focus:ring-2"
                      />
                      <label htmlFor="sendToAll" className="cursor-pointer">
                        Include users who already received the email
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Email Config */}
            <div className="md:col-span-2 bg-[#1B1B4D] border border-white/10 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#F5841F]" />
                Configure Email
              </h2>
              
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Calendar className="w-3 h-3"/> Date</label>
                    <input type="text" value={mailDate} onChange={e=>setMailDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Clock className="w-3 h-3"/> Time</label>
                    <input type="text" value={mailTime} onChange={e=>setMailTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><MapPin className="w-3 h-3"/> Location</label>
                  <input type="text" value={mailLocation} onChange={e=>setMailLocation(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Location Maps Link</label>
                  <input type="text" value={mailMapsLink} onChange={e=>setMailMapsLink(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><MapPin className="w-3 h-3"/> Marathon Route Link</label>
                  <input type="text" value={mailRouteLink} onChange={e=>setMailRouteLink(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm" placeholder="Link to the route map" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Route Image URL (or file path)</label>
                  <input type="text" value={mailRouteImage} onChange={e=>setMailRouteImage(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm" placeholder="e.g. map.jpeg" />
                </div>
              </div>

              {mailSuccess ? (
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center text-green-400 font-bold mt-4 flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-8 h-8" />
                  Emails have been successfully dispatched!
                </div>
              ) : isMailing && progress.total > 0 ? (
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 mt-8 space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#F5841F]" />
                      Sending Emails...
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      {progress.current} / {progress.total}
                    </div>
                  </div>
                  <div className="w-full bg-[#0D0D2B] rounded-full h-3 border border-white/10 overflow-hidden">
                    <div 
                      className="bg-[#F5841F] h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 text-center">Please do not close this tab until complete.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 mt-8">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Mail className="w-3 h-3"/> Test Email Recipient</label>
                    <input type="email" value={testEmailAddress} onChange={e=>setTestEmailAddress(e.target.value)} className="w-full bg-[#1B1B4D] border border-white/10 rounded-lg p-2 text-white text-sm" />
                    
                    <button 
                      onClick={handleSendTestMail}
                      disabled={isTesting}
                      className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 border border-white/20"
                    >
                      {isTesting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                      {isTesting ? 'Sending...' : 'Send Test Mail'}
                    </button>
                  </div>

                  <button 
                    onClick={handleSendBulkMail}
                    disabled={isTesting || targetUsers.length === 0 || loading}
                    className="w-full bg-[#F5841F] hover:bg-[#F5841F]/90 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(245,132,31,0.3)] disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {`Send Bulk Mail (${targetUsers.length})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
