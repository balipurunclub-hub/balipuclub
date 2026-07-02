import { NextRequest } from 'next/server';
import { razorpay, REGISTRATION_FEE_PAISE } from '@/lib/razorpay';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  const requiredEnvVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(key => !process.env[key]);
  if (missingVars.length > 0) {
    return Response.json({ 
      error: `Missing environment variables in Vercel: ${missingVars.join(', ')}` 
    }, { status: 500 });
  }

  let adminAuth;
  try {
    adminAuth = getAdminAuth();
  } catch (err) {
    console.error('Firebase Admin init error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Server configuration error: ${msg}` }, { status: 500 });
  }

  // 1. Verify Firebase ID token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idToken = authHeader.slice(7);
  let uid: string;

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }

  // 2. Create Razorpay order
  try {
    const order = await razorpay.orders.create({
      amount: REGISTRATION_FEE_PAISE,
      currency: 'INR',
      receipt: `reg_${uid.slice(0, 8)}_${Date.now()}`,
      notes: {
        uid,
        event: process.env.NEXT_PUBLIC_EVENT_NAME || 'Balipu',
      },
    });

    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err: any) {
    console.error('[Razorpay create-order]', err);
    const msg = err?.error?.description || err?.message || String(err);
    return Response.json(
      { error: `Failed to create order: ${msg}` },
      { status: 500 }
    );
  }
}
