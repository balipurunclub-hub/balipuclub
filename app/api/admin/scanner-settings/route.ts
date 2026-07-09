import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('metadata').doc('scannerSettings');
    const snap = await docRef.get();
    
    if (!snap.exists) {
      return NextResponse.json({ allowFreeTierScan: true, allowPaidTierScan: true });
    }
    
    return NextResponse.json(snap.data());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const adminDb = getAdminDb();
    const docRef = adminDb.collection('metadata').doc('scannerSettings');
    await docRef.set(body, { merge: true });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
