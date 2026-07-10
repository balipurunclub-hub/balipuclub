'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { AdminRoute } from '@/components/AdminRoute';
import { UploadCloud, CheckCircle2, AlertCircle, Mail, MapPin, Calendar, Clock, Link as LinkIcon, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [entryType, setEntryType] = useState('paid');
  const [startBib, setStartBib] = useState('');
  const [bibLoading, setBibLoading] = useState(true);
  const [bibAutoFetched, setBibAutoFetched] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any[] | null>(null);
  const [failedEntries, setFailedEntries] = useState<any[] | null>(null);
  const [uploadError, setUploadError] = useState('');

  const [isMailing, setIsMailing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isTesting, setIsTesting] = useState(false);
  const [mailSuccess, setMailSuccess] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('jeetheshkarate@gmail.com');
  
  // Mail template fields
  const [mailDate, setMailDate] = useState('10th July 2026');
  const [mailTime, setMailTime] = useState('2:00 PM - 7:30PM');
  const [mailLocation, setMailLocation] = useState('Decathlon Sports - 1st floor, Bharath Mall, Bejai Kavoor Rd, opposite KSRTC, Lalbagh, Mangaluru, Karnataka 575004');
  const [mailMapsLink, setMailMapsLink] = useState('https://maps.app.goo.gl/hacfPsQE4KWpT3re6');
  const [mailRouteLink, setMailRouteLink] = useState('https://maps.app.goo.gl/WuC7oC5PWhyZ5n9o9');
  const [mailRouteImage, setMailRouteImage] = useState('map.jpeg');

  // Auto-fetch next BIB on mount
  useEffect(() => {
    fetch('/api/admin/bulk-upload')
      .then(r => r.json())
      .then(data => {
        if (data.nextBib) {
          setStartBib(String(data.nextBib));
          setBibAutoFetched(true);
        }
      })
      .catch(() => setStartBib('1'))
      .finally(() => setBibLoading(false));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setIsParsing(true);
      
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const errors: string[] = [];

          const mappedData = results.data.map((row: any, index: number) => {
            const getVal = (keys: string[]) => {
              for (const k of keys) {
                const foundKey = Object.keys(row).find(header => header.toLowerCase().includes(k.toLowerCase()));
                if (foundKey && row[foundKey]) return row[foundKey].toString().trim();
              }
              return '';
            };

            const entry = {
              name: getVal(['name', 'first', 'full']),
              email: getVal(['email', 'mail']),
              phone: getVal(['phone', 'mobile', 'contact']),
              age: getVal(['age', 'dob']),
              gender: getVal(['gender', 'sex']),
              city: getVal(['city', 'town', 'location']),
              emergencyContact: getVal(['emergency', 'emg']),
              idProofType: getVal(['id proof type', 'proof type', 'id type']),
              idProofNumber: getVal(['id proof number', 'proof number', 'id number']),
              jerseySize: getVal(['jersey', 't-shirt', 'tshirt', 'size']),
              source: getVal(['source', 'where']) || 'Bulk CSV Upload',
            };

            // Ensure all essential fields are filled
            const requiredFields = ['name', 'email', 'phone', 'age', 'gender', 'city', 'emergencyContact', 'idProofType', 'idProofNumber', 'jerseySize'];
            const missing = requiredFields.filter(f => !entry[f as keyof typeof entry]);
            
            if (missing.length > 0) {
              errors.push(`Row ${index + 2}: Missing ${missing.join(', ')}`);
            }

            // Auto-fill missing values
            entry.name = entry.name || 'Yet to be submitted';
            entry.email = entry.email || 'Yet to be submitted';
            entry.phone = entry.phone || 'Yet to be submitted';
            entry.age = entry.age || 'Yet to be submitted';
            entry.gender = entry.gender || 'Yet to be submitted';
            entry.city = entry.city || 'Yet to be submitted';
            entry.emergencyContact = entry.emergencyContact || 'Yet to be submitted';
            entry.idProofType = entry.idProofType || 'Yet to be submitted';
            entry.idProofNumber = entry.idProofNumber || 'Yet to be submitted';
            entry.jerseySize = entry.jerseySize || 'Yet to be submitted';

            return entry;
          });

          if (errors.length > 0) {
            const proceed = confirm(`Validation Warning! Missing values found:\n\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...and more' : ''}\n\nDo you want to proceed and auto-fill these missing fields with placeholders?`);
            if (!proceed) {
              setFile(null);
              setIsParsing(false);
              // Reset input file element
              const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
              if (fileInput) fileInput.value = '';
              return;
            }
          }

          setParsedData(mappedData);
          setIsParsing(false);
        },
        error: (err) => {
          console.error(err);
          alert('Failed to parse CSV file');
          setIsParsing(false);
        }
      });
    }
  };

  const handleUploadToDb = async () => {
    if (parsedData.length === 0) return;
    setIsUploading(true);
    setUploadError('');
    
    try {
      const res = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: parsedData,
          entryType,
          startBibNumber: parseInt(startBib) || 1
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload');
      
      setUploadResult(data.inserted);
      setFailedEntries(data.failed?.length > 0 ? data.failed : null);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendBulkMail = async () => {
    if (!uploadResult || uploadResult.length === 0) return;
    if (!confirm(`Are you sure you want to send emails to ${uploadResult.length} uploaded users?`)) {
      return;
    }
    
    setIsMailing(true);
    setMailSuccess(false);
    setProgress({ current: 0, total: uploadResult.length });
    
    const BATCH_SIZE = 10;
    let sentSoFar = 0;

    try {
      for (let i = 0; i < uploadResult.length; i += BATCH_SIZE) {
        const batch = uploadResult.slice(i, i + BATCH_SIZE);
        
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
        setProgress({ current: sentSoFar, total: uploadResult.length });
      }
      
      setMailSuccess(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsMailing(false);
    }
  };

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

  return (
    <AdminRoute>
      <div className="min-h-screen bg-[#0D0D2B] pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-white mb-2">Bulk CSV Importer</h1>
              <p className="text-slate-400">Hidden route: Upload form entries directly into the database.</p>
            </div>
            <Link href="/admin" className="text-[#F5841F] hover:underline font-semibold">
              &larr; Back to Admin
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: DB Upload */}
            <div className="space-y-6">
              <div className="bg-[#1B1B4D] border border-white/10 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-bold text-white mb-4">1. Database Import</h2>
                
                {uploadResult ? (
                  <div className="animate-fade-in text-center py-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-center text-white mb-2">Upload Complete!</h2>
                    <p className="text-slate-400 text-center mb-6">
                      {uploadResult.length} entries have been successfully added to the database.
                    </p>

                    {failedEntries && failedEntries.length > 0 && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4 text-left">
                        <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" /> 
                          {failedEntries.length} entries failed
                        </h3>
                        <div className="max-h-40 overflow-y-auto">
                          <ul className="text-sm text-red-300 space-y-1 list-disc list-inside">
                            {failedEntries.map((f, i) => (
                              <li key={i}>{f.entry?.name || f.entry?.email || 'Unknown'} - {f.reason}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-8">
                      <Link 
                        href="/admin/send-emails"
                        className="inline-flex items-center justify-center gap-2 w-full bg-[#F5841F] hover:bg-[#F5841F]/90 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(245,132,31,0.3)]"
                      >
                        <Mail className="w-5 h-5" />
                        Go to Send Emails Page
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Select Entry Type</label>
                      <select 
                        value={entryType} 
                        onChange={(e) => setEntryType(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[#F5841F]/50 outline-none"
                      >
                        <option value="free" className="text-slate-900">Free Entry</option>
                        <option value="paid" className="text-slate-900">Paid Entry</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex text-sm font-semibold text-slate-300 mb-2 items-center justify-between">
                        <span>Starting BIB Number</span>
                        {bibLoading ? (
                          <span className="text-xs text-slate-500 font-normal animate-pulse">Fetching...</span>
                        ) : bibAutoFetched ? (
                          <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">&#10003; Auto-fetched</span>
                        ) : null}
                      </label>
                      <input 
                        type="number" 
                        value={startBib} 
                        onChange={(e) => setStartBib(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-[#F5841F]/50 outline-none font-mono disabled:opacity-60"
                        placeholder="e.g. 1"
                        disabled={bibLoading}
                      />
                      {!bibLoading && (
                        <p className="text-xs text-slate-500 mt-1">Next after highest existing BIB in the database. You can still edit it.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">CSV File</label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#F5841F]/50 hover:bg-white/5 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-sm text-slate-400 font-semibold text-center px-4">{file ? file.name : "Click to upload CSV"}</p>
                        </div>
                        <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>

                    <button 
                      onClick={handleUploadToDb}
                      disabled={parsedData.length === 0 || isUploading}
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      {isUploading ? 'Uploading to DB...' : 'Upload to Database'}
                    </button>
                    {uploadError && (
                      <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-lg">{uploadError}</p>
                    )}
                  </div>
                )}
              </div>
              
              {!uploadResult && (
                <div className="bg-[#1B1B4D] border border-white/10 rounded-2xl p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white">Preview Data</h2>
                    <span className="text-sm text-slate-400 bg-white/5 px-3 py-1 rounded-full font-mono">
                      {parsedData.length} rows
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto rounded-xl border border-white/5">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-white/5 text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {parsedData.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-12 text-center text-slate-500">
                              Upload a CSV to preview.
                            </td>
                          </tr>
                        ) : (
                          parsedData.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="text-slate-300 hover:bg-white/5">
                              <td className="px-4 py-3">{row.name || <span className="text-red-400 text-xs">Missing</span>}</td>
                              <td className="px-4 py-3">{row.email || <span className="text-red-400 text-xs">Missing</span>}</td>
                              <td className="px-4 py-3">{row.phone || '-'}</td>
                            </tr>
                          ))
                        )}
                        {parsedData.length > 5 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-center text-slate-500 text-xs">
                              ... and {parsedData.length - 5} more rows.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Email Config */}
            <div className="bg-[#1B1B4D] border border-white/10 rounded-2xl p-6 shadow-xl h-fit">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#F5841F]" />
                2. Send Emails to Uploaded List
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
                    disabled={isTesting || !uploadResult || uploadResult.length === 0}
                    className="w-full bg-[#F5841F] hover:bg-[#F5841F]/90 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(245,132,31,0.3)] disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {`Send Bulk Mail ${uploadResult ? `(${uploadResult.length})` : '(Requires DB Upload)'}`}
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
