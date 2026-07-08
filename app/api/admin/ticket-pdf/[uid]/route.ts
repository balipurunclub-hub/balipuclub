import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const db = getAdminDb();

    const docRef = await db.collection('registrations').doc(uid).get();
    if (!docRef.exists) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const reg = docRef.data() as any;
    const qrBuffer = await QRCode.toBuffer(uid, {
      width: 250,
      margin: 2,
      color: { dark: '#1B1B4D', light: '#FFFFFF' }
    });

    // Create a Promise to build the PDF buffer
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });

        // Background / Header
        doc.rect(0, 0, 595.28, 120).fill('#F5841F');
        doc.fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .fontSize(32)
           .text('BALIPU RUN CLUB', 0, 45, { align: 'center' });
        doc.fontSize(16)
           .text('THE MONSOON RUN - E-TICKET', 0, 85, { align: 'center' });

        // QR Code
        doc.image(qrBuffer, 172.64, 150, { width: 250 });

        // Participant Info
        doc.fillColor('#1B1B4D')
           .fontSize(24)
           .font('Helvetica-Bold')
           .text(reg.name, 0, 420, { align: 'center' });

        doc.fillColor('#64748b')
           .fontSize(14)
           .font('Courier')
           .text(`Ticket ID: ${reg.ticketId || uid.slice(0, 8).toUpperCase()}`, 0, 455, { align: 'center' });

        if (reg.bibNumber) {
          doc.fillColor('#F5841F')
             .font('Helvetica-Bold')
             .fontSize(18)
             .text(`BIB: ${reg.bibNumber}`, 0, 490, { align: 'center' });
        }

        const isFree = reg.entryType === 'free';

        // Ticket Type Label
        doc.fillColor(isFree ? '#10b981' : '#F5841F')
           .font('Helvetica-Bold')
           .fontSize(14)
           .text(isFree ? 'FREE TIER' : 'PAID TIER', 0, 510, { align: 'center' });

        // Details block
        doc.rect(147.64, 530, 300, 150).lineWidth(1).stroke('#e2e8f0');
        doc.fillColor('#1B1B4D').font('Helvetica-Bold').fontSize(12);
        
        let y = 550;
        doc.text('Date:', 170, y);
        doc.font('Helvetica').text(isFree ? '11th July 2026' : '12th July 2026', 280, y);
        y += 25;
        
        doc.font('Helvetica-Bold').text('Time:', 170, y);
        doc.font('Helvetica').text('6:30 AM', 280, y);
        y += 25;
        
        doc.font('Helvetica-Bold').text('Venue:', 170, y);
        doc.font('Helvetica').text('Fiza by nexus', 280, y);
        y += 25;
        
        if (!isFree) {
          doc.font('Helvetica-Bold').text('Jersey Size:', 170, y);
          doc.font('Helvetica').text(reg.jerseySize || 'N/A', 280, y);
        }

        // Footer
        doc.fillColor('#94a3b8')
           .fontSize(10)
           .font('Helvetica')
           .text('Please present this QR code at the registration desk on event day.', 0, 720, { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Balipu_Ticket_${reg.name.replace(/\s+/g, '_')}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
