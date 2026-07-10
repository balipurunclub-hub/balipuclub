/**
 * Firestore Backup Script
 * Usage: node scripts/backup-db.mjs
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
const privateKey = rawKey.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

if (!privateKey) { console.error('FIREBASE_PRIVATE_KEY missing'); process.exit(1); }

if (getApps().length === 0) {
  initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey }) });
}

const db = getFirestore();

async function backupCollection(name) {
  const snap = await db.collection(name).get();
  const docs = {};
  snap.forEach((doc) => {
    const data = {};
    for (const [k, v] of Object.entries(doc.data())) {
      data[k] = (v && typeof v.toDate === 'function') ? v.toDate().toISOString() : v;
    }
    docs[doc.id] = data;
  });
  return docs;
}

async function main() {
  console.log('Connecting to Firestore...');
  const cols = await db.listCollections();
  const names = cols.map(c => c.id);
  console.log('Collections:', names.join(', '));

  const backup = { exportedAt: new Date().toISOString(), projectId: process.env.FIREBASE_PROJECT_ID, collections: {} };

  for (const name of names) {
    process.stdout.write(`  Exporting "${name}"... `);
    backup.collections[name] = await backupCollection(name);
    console.log(Object.keys(backup.collections[name]).length + ' docs');
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = resolve(__dirname, '../backups');
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, `backup-${ts}.json`);
  writeFileSync(outFile, JSON.stringify(backup, null, 2), 'utf8');

  const total = names.reduce((s, n) => s + Object.keys(backup.collections[n]).length, 0);
  console.log(`\nBackup complete! ${total} total documents`);
  console.log('Saved to:', outFile);
}

main().catch(e => { console.error('Backup failed:', e); process.exit(1); });
