'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminShell } from '@/components/admin/AdminShell';
import { Mail, MapPin, Calendar, Clock, Link as LinkIcon, RefreshCw, CheckCircle2, AlertCircle, Users } from 'lucide-react';
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
  const [filterEntryType, setFilterEntryType] = useState('all');

  const [mailDate, setMailDate] = useState('10th July 2026');
  const [mailTime, setMailTime] = useState('2:00 PM - 7:30PM');
  const [mailLocation, setMailLocation] = useState(
    'Decathlon Sports - 1st floor, Bharath Mall, Bejai Kavoor Rd, opposite KSRTC, Lalbagh, Mangaluru, Karnataka 575004'
  );
  const [mailMapsLink, setMailMapsLink] = useState('https://maps.app.goo.gl/hacfPsQE4KWpT3re6');
  const [mailRouteLink, setMailRouteLink] = useState('https://maps.app.goo.gl/sqSHqAcyAWqnFgvs8');
  const [mailRouteImage, setMailRouteImage] = useState('map.png');

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/admin/registrations');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch registrations');
      setRegistrations(data.registrations || []);
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

  const targetUsers = registrations.filter((r) => {
    const meetsEmailSentCriteria = sendToAll ? true : !r.emailSent;
    const meetsEntryTypeCriteria =
      filterEntryType === 'all'
        ? true
        : filterEntryType === 'paid'
          ? r.entryType !== 'free'
          : r.entryType === 'free';
    return meetsEmailSentCriteria && meetsEntryTypeCriteria;
  });

  const handleSendTestMail = async () => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/admin/bulk-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: [
            {
              name: 'Test Runner',
              email: testEmailAddress,
              ticketId: 'BRC-001',
              bibNumber: 999,
              jerseySize: 'L',
              entryType: 'paid',
            },
          ],
          mailDate,
          mailTime,
          mailLocation,
          mailMapsLink,
          mailRouteLink,
          mailRouteImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send test email');

      alert(`Test email sent successfully to ${testEmailAddress}!`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
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
            mailRouteImage,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send emails');

        sentSoFar += batch.length;
        setProgress({ current: sentSoFar, total: targetUsers.length });
      }

      setMailSuccess(true);
      fetchRegistrations();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed');
    } finally {
      setIsMailing(false);
    }
  };

  const fieldClass =
    'w-full min-w-0 bg-black/50 border border-white/15 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-[#FF2D87]/60';

  return (
    <AdminRoute>
      <AdminShell
        title="Send Emails"
        description="Configure and send ticket emails to participants."
        backHref="/admin"
        maxWidth="4xl"
      >
        {fetchError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 flex items-center gap-2 min-w-0 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="break-words">{fetchError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 min-w-0">
          <div className="md:col-span-1 space-y-6 min-w-0">
            <div className="bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-2xl p-4 sm:p-6 min-w-0">
              <h2 className="font-heading text-white uppercase tracking-wide text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#FF2D87] shrink-0" />
                Recipients
              </h2>

              {loading ? (
                <div className="text-white/50 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#FF2D87]" /> Loading users...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-black/40 rounded-xl p-4 border border-white/10 text-center">
                    <div className="font-heading text-[#FF2D87] text-3xl mb-1">{targetUsers.length}</div>
                    <div className="text-xs text-white/45 uppercase tracking-[0.15em]">Target users</div>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-white/70 bg-black/40 p-3 rounded-xl border border-white/10">
                    <input
                      type="checkbox"
                      id="sendToAll"
                      checked={sendToAll}
                      onChange={(e) => setSendToAll(e.target.checked)}
                      className="w-4 h-4 mt-0.5 accent-[#FF2D87]"
                    />
                    <label htmlFor="sendToAll" className="cursor-pointer">
                      Include users who already received the email
                    </label>
                  </div>

                  <div className="bg-black/40 p-3 rounded-xl border border-white/10">
                    <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2">
                      Filter by entry type
                    </label>
                    <select
                      value={filterEntryType}
                      onChange={(e) => setFilterEntryType(e.target.value)}
                      className={fieldClass}
                    >
                      <option value="all" className="bg-black">
                        All Entries
                      </option>
                      <option value="paid" className="bg-black">
                        Paid Entries Only
                      </option>
                      <option value="free" className="bg-black">
                        Free Entries Only
                      </option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 bg-[#0a0a0a] border border-[#FF2D87]/25 rounded-2xl p-4 sm:p-6 min-w-0">
            <h2 className="font-heading text-white uppercase tracking-wide text-lg mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#FF2D87] shrink-0" />
              Configure Email
            </h2>

            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Date
                  </label>
                  <input type="text" value={mailDate} onChange={(e) => setMailDate(e.target.value)} className={fieldClass} />
                </div>
                <div className="min-w-0">
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Time
                  </label>
                  <input type="text" value={mailTime} onChange={(e) => setMailTime(e.target.value)} className={fieldClass} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Location
                </label>
                <input type="text" value={mailLocation} onChange={(e) => setMailLocation(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> Location maps link
                </label>
                <input type="text" value={mailMapsLink} onChange={(e) => setMailMapsLink(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Route link
                </label>
                <input type="text" value={mailRouteLink} onChange={(e) => setMailRouteLink(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> Route image
                </label>
                <input type="text" value={mailRouteImage} onChange={(e) => setMailRouteImage(e.target.value)} className={fieldClass} />
              </div>
            </div>

            {mailSuccess ? (
              <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-4 text-center text-emerald-400 font-semibold flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8" />
                Emails have been successfully dispatched!
              </div>
            ) : isMailing && progress.total > 0 ? (
              <div className="bg-black/40 p-6 rounded-2xl border border-white/10 space-y-4">
                <div className="flex justify-between items-end">
                  <div className="text-sm font-semibold text-white/70 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#FF2D87]" />
                    Sending emails...
                  </div>
                  <div className="text-xs font-mono text-white/40">
                    {progress.current} / {progress.total}
                  </div>
                </div>
                <div className="w-full bg-black rounded-full h-2 border border-white/10 overflow-hidden">
                  <div
                    className="bg-[#FF2D87] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-white/40 text-center">Please do not close this tab until complete.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/10 space-y-3">
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em] flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Test email recipient
                  </label>
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className={fieldClass}
                  />
                  <button
                    onClick={handleSendTestMail}
                    disabled={isTesting}
                    className="w-full min-h-11 rounded-full border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isTesting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                    {isTesting ? 'Sending...' : 'Send Test Mail'}
                  </button>
                </div>

                <button
                  onClick={handleSendBulkMail}
                  disabled={isTesting || targetUsers.length === 0 || loading}
                  className="w-full min-h-11 rounded-full bg-[#FF2D87] hover:bg-[#ff4d9a] text-white font-semibold transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {`Send Bulk Mail (${targetUsers.length})`}
                </button>
              </div>
            )}
          </div>
        </div>
      </AdminShell>
    </AdminRoute>
  );
}
