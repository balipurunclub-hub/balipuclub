import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDmXvd8cMgrmaTjTrQISdFbvs2qnxvPPxw",
  authDomain: "balipu.firebaseapp.com",
  projectId: "balipu",
  storageBucket: "balipu.firebasestorage.app",
  messagingSenderId: "283632424868",
  appId: "1:283632424868:web:109c92e6a9200da01d9331",
  measurementId: "G-21B0WHDLVF"
};

// Prevent re-initializing on hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
