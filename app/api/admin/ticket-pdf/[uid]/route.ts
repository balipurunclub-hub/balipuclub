import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { registrations } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const rows = await db.select().from(registrations).where(eq(registrations.id, uid)).limit(1);
    if (!rows[0]) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const reg = rows[0];
    const ticketCode = reg.ticketId || uid;
    const isAloysius = reg.eventId === 'balipu-x-aloysius';
    const eventLabel = isAloysius ? 'BALIPU X ALOYSIUS' : 'THE MONSOON RUN';
    const eventDate = isAloysius ? '11th October 2026' : '12th July 2026';
    const venue = isAloysius ? 'Mangaluru' : 'Fiza by nexus';
    const accent = '#FF2D87';
    const navy = '#1B1B4D';

    const qrBuffer = await QRCode.toBuffer(ticketCode, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: navy, light: '#FFFFFF' },
    });

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        doc.rect(0, 0, 595.28, 120).fill(accent);
        doc
          .fillColor('#FFFFFF')
          .font('Helvetica-Bold')
          .fontSize(28)
          .text('BALIPU RUN CLUB', 0, 40, { align: 'center' });
        doc.fontSize(14).text(`${eventLabel} — E-TICKET`, 0, 80, { align: 'center' });

        doc.image(qrBuffer, 157.64, 150, { width: 280 });

        doc
          .fillColor(navy)
          .fontSize(22)
          .font('Helvetica-Bold')
          .text(reg.name, 0, 450, { align: 'center' });

        doc
          .fillColor(accent)
          .fontSize(18)
          .font('Courier-Bold')
          .text(ticketCode, 0, 485, { align: 'center' });

        if (reg.bibNumber != null) {
          doc
            .fillColor(navy)
            .font('Helvetica-Bold')
            .fontSize(16)
            .text(`BIB: ${reg.bibNumber}`, 0, 515, { align: 'center' });
        }

        const isFree = reg.entryType === 'free';
        doc
          .fillColor(isFree ? '#10b981' : accent)
          .font('Helvetica-Bold')
          .fontSize(12)
          .text(isFree ? 'FREE ENTRY' : 'PAID ENTRY', 0, 540, { align: 'center' });

        doc.rect(147.64, 565, 300, 120).lineWidth(1).stroke('#e2e8f0');

        let y = 580;
        doc.fillColor(navy).font('Helvetica-Bold').fontSize(12);
        doc.text('Date:', 170, y);
        doc.font('Helvetica').text(eventDate, 280, y);
        y += 24;
        doc.font('Helvetica-Bold').text('Time:', 170, y);
        doc.font('Helvetica').text('6:30 AM', 280, y);
        y += 24;
        doc.font('Helvetica-Bold').text('Venue:', 170, y);
        doc.font('Helvetica').text(venue, 280, y);
        y += 24;
        if (!isFree) {
          doc.font('Helvetica-Bold').text('Jersey:', 170, y);
          doc.font('Helvetica').text(reg.jerseySize || 'N/A', 280, y);
        }

        doc
          .fillColor('#94a3b8')
          .fontSize(10)
          .font('Helvetica')
          .text('Present this QR code at check-in on event day.', 0, 720, { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });

    const safeName = (reg.name || 'ticket').replace(/[^\w\-]+/g, '_');
    const safeCode = ticketCode.replace(/[^\w\-]+/g, '_');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Balipu_Ticket_${safeCode}_${safeName}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
