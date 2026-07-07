import { getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const adminDb = getAdminDb();
    const { entries, entryType, startBibNumber } = await req.json();

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'No entries provided' }, { status: 400 });
    }

    // Get starting ticket counter
    const counterRef = adminDb.collection('eventCounters').doc('monsoon-run');
    let ticketCount = 1000;
    
    await adminDb.runTransaction(async (t) => {
      const docSnap = await t.get(counterRef);
      if (docSnap.exists) {
        ticketCount = docSnap.data()?.count || 1000;
      }
      // Update counter for the future
      t.set(counterRef, { count: ticketCount + entries.length }, { merge: true });
    });

    let currentBib = parseInt(startBibNumber) || 1;
    let currentTicketCount = ticketCount + 1;

    const results: any[] = [];
    const failed: any[] = [];
    const promises: Promise<void>[] = [];

    for (const entry of entries) {
      const newRegRef = adminDb.collection('registrations').doc();
      const ticketId = `BRC-MR-${currentTicketCount}`;
      const bib = currentBib;

      const regData = {
        name: entry.name || '',
        email: entry.email || '',
        phone: entry.phone || '',
        age: parseInt(entry.age) || 0,
        gender: entry.gender || 'Prefer not to say',
        city: entry.city || '',
        emergencyContact: entry.emergencyContact || '',
        idProofType: entry.idProofType || '',
        idProofNumber: entry.idProofNumber || '',
        source: entry.source || 'Bulk Upload',
        jerseySize: entry.jerseySize || 'N/A',
        paymentStatus: 'paid', // Always paid or implicitly approved
        paymentId: 'bulk_' + Math.random().toString(36).substring(7),
        ticketId,
        bibNumber: bib,
        entryType: entryType || 'paid',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const promise = newRegRef.set(regData)
        .then(() => {
          results.push({
            uid: newRegRef.id,
            ...regData
          });
        })
        .catch((err) => {
          failed.push({
            entry,
            reason: err.message
          });
        });

      promises.push(promise);
      
      currentBib++;
      currentTicketCount++;
    }

    await Promise.allSettled(promises);

    return NextResponse.json({ 
      success: true, 
      count: results.length, 
      inserted: results,
      failedCount: failed.length,
      failed: failed
    }, { status: 200 });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
