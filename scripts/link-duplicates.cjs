/**
 * Link Duplicate BIB Entries
 * 
 * Sets a "linkedDocId" field on each duplicate pair so that
 * scanning either one will mark both as attended.
 *
 * PAIRS: [ keepBib, deleteBib ] - both are kept, just linked
 */
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { readFileSync } = require("fs");

const envLines = readFileSync(".env.local", "utf8").split("\n");
const env = {};
for (const line of envLines) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  env[line.slice(0,i).trim()] = line.slice(i+1).trim().replace(/^"+|"+$/g,"");
}
const privateKey = (env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
if (!privateKey) { console.error("FIREBASE_PRIVATE_KEY missing"); process.exit(1); }

if (getApps().length === 0) {
  initializeApp({ credential: cert({ projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey }) });
}
const db = getFirestore();

const PAIRS = [
  [143, 160],
  [3,   4],
  [19,  79],
  [142, 150],
  [144, 148],
  [35,  36],
  [156, 157],
];

const isDryRun = !process.argv.includes("--execute");

async function findByBib(bib) {
  const snap = await db.collection("registrations").where("bibNumber", "==", bib).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, data: snap.docs[0].data() };
}

async function main() {
  console.log(isDryRun
    ? "=== DRY RUN (no changes made) ==="
    : "=== EXECUTE: Linking duplicate pairs ===");
  console.log("");

  for (const [bibA, bibB] of PAIRS) {
    const docA = await findByBib(bibA);
    const docB = await findByBib(bibB);

    if (!docA) { console.log(`[SKIP] BIB ${bibA} not found`); continue; }
    if (!docB) { console.log(`[SKIP] BIB ${bibB} not found`); continue; }

    console.log(`[PAIR] BIB ${bibA} (${docA.data.name}) <-> BIB ${bibB} (${docB.data.name})`);
    console.log(`       DocA: ${docA.id} | DocB: ${docB.id}`);

    if (!isDryRun) {
      await db.collection("registrations").doc(docA.id).update({ linkedDocId: docB.id });
      await db.collection("registrations").doc(docB.id).update({ linkedDocId: docA.id });
      console.log("       -> Linked!");
    }
    console.log("");
  }

  if (isDryRun) {
    console.log("Dry run done. Run with --execute to apply links.");
  } else {
    console.log("All pairs linked successfully.");
  }
}

main().catch(e => { console.error("Error:", e.message); process.exit(1); });
