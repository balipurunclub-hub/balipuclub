import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

function getAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!privateKey) {
    console.warn('FIREBASE_PRIVATE_KEY is missing. Firebase Admin SDK will not be initialized.');
    return null;
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export function getAdminDb(): Firestore {
  const app = getAdminApp();
  if (!app) throw new Error('Firebase Admin not initialized');
  return getFirestore(app);
}

export function getAdminAuth(): Auth {
  const app = getAdminApp();
  if (!app) throw new Error('Firebase Admin not initialized');
  return getAuth(app);
}
