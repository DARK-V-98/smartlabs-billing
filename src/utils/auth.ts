import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type Role = 'developer' | 'owner' | 'admin';

export interface AppUser {
  username: string;
  displayName: string;
  role: Role;
}

interface StoredUser extends AppUser {
  passwordHash: string;
  createdAt: string;
}

const USERS_COLLECTION = 'users';
const SESSION_KEY = 'smartlabs_session_v1';

export async function hashPassword(username: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${username.trim().toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function login(username: string, password: string): Promise<AppUser | null> {
  const key = username.trim().toLowerCase();
  if (!key || !password) return null;
  const snap = await getDoc(doc(db, USERS_COLLECTION, key));
  if (!snap.exists()) return null;
  const stored = snap.data() as StoredUser;
  const hash = await hashPassword(key, password);
  if (hash !== stored.passwordHash) return null;
  return { username: stored.username, displayName: stored.displayName, role: stored.role };
}

export async function listUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, USERS_COLLECTION));
  return snap.docs
    .map(d => d.data() as StoredUser)
    .map(({ username, displayName, role }) => ({ username, displayName, role }))
    .sort((a, b) => a.username.localeCompare(b.username));
}

export async function createUser(username: string, displayName: string, role: Role, password: string): Promise<void> {
  const key = username.trim().toLowerCase();
  if (!/^[a-z0-9_.-]+$/.test(key)) throw new Error('Username may only use letters, numbers, dot, dash or underscore.');
  const ref = doc(db, USERS_COLLECTION, key);
  if ((await getDoc(ref)).exists()) throw new Error(`User "${key}" already exists.`);
  const stored: StoredUser = {
    username: key,
    displayName: displayName.trim() || key,
    role,
    passwordHash: await hashPassword(key, password),
    createdAt: new Date().toISOString()
  };
  await setDoc(ref, stored);
}

export async function setUserPassword(username: string, password: string): Promise<void> {
  await updateDoc(doc(db, USERS_COLLECTION, username), {
    passwordHash: await hashPassword(username, password)
  });
}

export async function deleteUser(username: string): Promise<void> {
  if (username === 'vishwa') throw new Error('The developer account cannot be deleted.');
  await deleteDoc(doc(db, USERS_COLLECTION, username));
}

// The session lives only in this browser tab; closing the tab logs out.
export function loadSession(): AppUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(user: AppUser | null): void {
  try {
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage blocked: the user simply has to log in again next time
  }
}

/** Owner and developer can see every admin's students and commission figures. */
export const canSeeAll = (user: AppUser): boolean => user.role === 'owner' || user.role === 'developer';

export const isDeveloper = (user: AppUser): boolean => user.role === 'developer';
