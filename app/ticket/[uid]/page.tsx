import { getAdminDb } from '@/lib/firebaseAdmin';
import QRCode from 'qrcode';
import Image from 'next/image';
import { Calendar, Clock, MapPin, Hash, Shirt } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function TicketPage({ params }: { params: { uid: string } }) {
  const db = getAdminDb();
  const { uid } = await params;
  const doc = await db.collection('registrations').doc(uid).get();
  
  if (!doc.exists) {
    notFound();
  }
  
  const reg = doc.data() as any;
  const qrDataUrl = await QRCode.toDataURL(uid, {
    width: 300,
    margin: 2,
    color: { dark: '#1B1B4D', light: '#FFFFFF' }
  });

  return (
    <div className="min-h-screen bg-[#0D0D2B] text-white flex flex-col items-center py-12 px-4 font-sans">
      <div className="max-w-md w-full bg-white text-[#1B1B4D] rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="bg-[#F5841F] p-6 text-center text-white relative">
          <h1 className="text-2xl font-black uppercase tracking-widest italic -skew-x-6">BALIPU RUN CLUB</h1>
          <p className="text-sm font-semibold opacity-90 mt-1">THE MONSOON RUN</p>
        </div>
        
        <div className="p-8 flex flex-col items-center relative">
          <div className="w-48 h-48 bg-white p-2 rounded-2xl shadow-md border border-slate-100 mb-6 relative">
            <Image src={qrDataUrl} alt="Ticket QR Code" fill className="object-contain rounded-xl" />
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-1">{reg.name}</h2>
          <p className="text-slate-500 font-mono text-sm mb-8 text-center">{reg.ticketId || params.uid.slice(0, 8).toUpperCase()}</p>
          
          <div className="w-full space-y-4">
            {reg.bibNumber && (
              <div className="flex items-center gap-3 bg-[#F5841F]/10 p-3 rounded-xl border border-[#F5841F]/20">
                <Hash className="w-5 h-5 text-[#F5841F]" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#F5841F]">BIB Number</p>
                  <p className="font-bold text-lg leading-tight">{reg.bibNumber}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Date</p>
                  <p className="font-semibold text-sm">12th July 2026</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Time</p>
                  <p className="font-semibold text-sm">6:30 AM</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Venue</p>
                <p className="font-semibold text-sm">Decathlon, Bharath Mall</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shirt className="w-5 h-5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Jersey Size</p>
                <p className="font-semibold text-sm">{reg.jerseySize || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
          Please present this QR code at the registration desk on event day.
        </div>
      </div>
    </div>
  );
}
