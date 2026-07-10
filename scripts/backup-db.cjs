const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { mkdirSync, writeFileSync, readFileSync } = require('fs');

// Load .env.local manually
const envLines = readFileSync('.env.local', 'utf8').split('\n');
const env = {};
for (const line of envLines) {
  if (!line || line.startsWith('#')) continue;
  const i = line.indexOf('=');
  if (i < 0) continue;
  env[line.slice(0,i).trim()] = line.slice(i+1).trim().replace(/^"+|"+$/g,'');
}

const privateKey = (env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
if (!privateKey) { console.error('FIREBASE_PRIVATE_KEY missing'); process.exit(1); }

if (getApps().length === 0) {
  initializeApp({ credential: cert({ projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey }) });
}
const db = getFirestore();

async function main() {
  console.log('Connecting to Firestore...');
  const cols = await db.listCollections();
  const names = cols.map(c => c.id);
  console.log('Collections found:', names.join(', '));
  const backup = { exportedAt: new Date().toISOString(), projectId: env.FIREBASE_PROJECT_ID, collections: {} };
  for (const name of names) {
    process.stdout.write('  Exporting "' + name + '"... ');
    const snap = await db.collection(name).get();
    const docs = {};
    snap.forEach(doc => {
      const raw = doc.data();
      const data = {};
      for (const [k,v] of Object.entries(raw)) {
        data[k] = (v && typeof v.toDate === 'function') ? v.toDate().toISOString() : v;
      }
      docs[doc.id] = data;
    });
    backup.collections[name] = docs;
    console.log(Object.keys(docs).length + ' docs');
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  mkdirSync('backups', { recursive: true });
  const outFile = 'backups/backup-' + ts + '.json';
  writeFileSync(outFile, JSON.stringify(backup, null, 2), 'utf8');
  const total = names.reduce((s,n) => s + Object.keys(backup.collections[n]).length, 0);
  console.log('');
  console.log('Backup complete! Total documents: ' + total);
  console.log('Saved to: ' + outFile);
}
main().catch(e => { console.error('Backup failed:', e.message); process.exit(1); });
