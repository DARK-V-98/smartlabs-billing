// One-time setup: creates the built-in login accounts in Firestore.
// Passwords are read from environment variables so they are never stored in the repo.
// Usage (PowerShell example):
//   $env:SEED_OSHADI_PASSWORD="..."; $env:SEED_ZAINEB_PASSWORD="..."; $env:SEED_LAHIRUKA_PASSWORD="..."; $env:SEED_VISHWA_PASSWORD="..."
//   node scripts/seed-users.mjs
// Existing accounts are skipped, never overwritten.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

// Read the Firebase config from .env (same values the app uses)
const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter(line => line.startsWith('VITE_FIREBASE_'))
    .map(line => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1).replace(/^"|"$/g, '')];
    })
);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
});
const db = getFirestore(app);

const ACCOUNTS = [
  { username: 'oshadi', displayName: 'Oshadi Vidarshana', role: 'admin', env: 'SEED_OSHADI_PASSWORD' },
  { username: 'zaineb', displayName: 'Zaineb', role: 'admin', env: 'SEED_ZAINEB_PASSWORD' },
  { username: 'lahiruka', displayName: 'Lahiruka', role: 'owner', env: 'SEED_LAHIRUKA_PASSWORD' },
  { username: 'vishwa', displayName: 'Vishwa', role: 'developer', env: 'SEED_VISHWA_PASSWORD' }
];

// Same hashing as src/utils/auth.ts: SHA-256 of "<username>:<password>"
const hash = (username, password) => createHash('sha256').update(`${username}:${password}`).digest('hex');

for (const account of ACCOUNTS) {
  const password = process.env[account.env];
  if (!password) {
    console.log(`skip ${account.username}: set ${account.env} to create it`);
    continue;
  }
  const ref = doc(db, 'users', account.username);
  if ((await getDoc(ref)).exists()) {
    console.log(`exists ${account.username}: left unchanged`);
    continue;
  }
  await setDoc(ref, {
    username: account.username,
    displayName: account.displayName,
    role: account.role,
    passwordHash: hash(account.username, password),
    createdAt: new Date().toISOString()
  });
  console.log(`created ${account.username}`);
}
process.exit(0);
