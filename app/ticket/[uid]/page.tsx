import { eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import Image from 'next/image';
import { Calendar, Clock, MapPin, Hash, Shirt, Download } from 'lucide-react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { registrations } from '@/lib/db/schema';

export default async function TicketPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const rows = await db.select().from(registrations).where(eq(registrations.id, uid)).limit(1);

  if (!rows[0]) {
    notFound();
  }

  const reg = rows[0];
  const registrationCode = reg.ticketId || uid;
  const qrDataUrl = await QRCode.toDataURL(registrationCode, {
    width: 360,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#1B1B4D', light: '#FFFFFF' },
  });

  const eventTitle =
    reg.eventId === 'balipu-x-aloysius' ? 'BALIPU X ALOYSIUS' : 'THE MONSOON RUN';

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center pt-24 pb-12 px-3 sm:px-4 font-sans overflow-x-clip">
      <div className="max-w-md w-full bg-white text-[#1B1B4D] rounded-3xl overflow-hidden shadow-2xl relative min-w-0">
        <div className="bg-[#FF2D87] p-4 sm:p-6 text-center text-white relative overflow-hidden">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest italic -skew-x-6 break-words px-1">
            BALIPU RUN CLUB
          </h1>
          <p className="text-sm font-semibold opacity-90 mt-1 break-words">{eventTitle}</p>
        </div>

        <div className="p-5 sm:p-8 flex flex-col items-center relative min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-slate-400 mb-3">
            Your unique QR
          </p>
          <div className="w-44 h-44 sm:w-52 sm:h-52 bg-white p-2 rounded-2xl shadow-md border border-slate-100 mb-4 relative">
            <Image
              src={qrDataUrl}
              alt={`QR code for ${registrationCode}`}
              fill
              className="object-contain rounded-xl"
            />
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-1">
            Registration ID
          </p>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-[#FF2D87] tracking-wider mb-4 break-all text-center">
            {registrationCode}
          </p>

          <a
            href={`/api/admin/ticket-pdf/${uid}`}
            download
            className="mb-8 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#FF2D87] px-6 py-3 text-sm font-semibold text-white hover:bg-[#ff4d9a] transition-colors"
          >
            <Download className="w-4 h-4 shrink-0" />
            Download PDF Ticket
          </a>

          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 break-words px-1">{reg.name}</h2>

          <div className="w-full space-y-4">
            {reg.bibNumber != null && (
              <div className="flex items-center gap-3 bg-[#FF2D87]/10 p-3 rounded-xl border border-[#FF2D87]/20">
                <Hash className="w-5 h-5 text-[#FF2D87]" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#FF2D87]">BIB Number</p>
                  <p className="font-bold text-lg leading-tight">{reg.bibNumber}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Date</p>
                  <p className="font-semibold text-sm">
                    {reg.eventId === 'balipu-x-aloysius' ? '11th October 2026' : '12th July 2026'}
                  </p>
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
                <p className="font-semibold text-sm">Mangaluru</p>
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
          Present this QR code at check-in. Code: {registrationCode}
        </div>
      </div>
    </div>
  );
}
