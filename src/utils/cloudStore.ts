import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { ReceiptData } from '../types/receipt';
import { AppUser } from './auth';

export interface StudentRecord {
  studentId: string;
  name: string;
  phone: string;
  email?: string;
  batch: string;
  addedBy: string;
  addedByName: string;
  addedAt: string;
  updatedAt: string;
}

const RECEIPTS = 'receipts';
const STUDENTS = 'students';
const COUNTERS = 'counters';
const FIRST_RECEIPT_NUMBER = 1041;

// Firestore rejects undefined values, so strip them out
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value));

// Document ids cannot contain "/"
const safeId = (value: string): string => value.trim().replace(/[/\\]/g, '_');

export function subscribeReceipts(onData: (receipts: ReceiptData[]) => void): () => void {
  return onSnapshot(
    collection(db, RECEIPTS),
    snap => onData(snap.docs.map(d => d.data() as ReceiptData)),
    err => console.error('Receipt sync failed', err)
  );
}

export function subscribeStudents(onData: (students: StudentRecord[]) => void): () => void {
  return onSnapshot(
    collection(db, STUDENTS),
    snap => onData(snap.docs.map(d => d.data() as StudentRecord)),
    err => console.error('Student sync failed', err)
  );
}

/** Reserves the next receipt number in the database so two computers never issue the same one. */
export async function allocateReceiptNumber(): Promise<string> {
  const ref = doc(db, COUNTERS, 'receipts');
  const next = await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? (snap.data().value as number) : FIRST_RECEIPT_NUMBER;
    const value = current + 1;
    tx.set(ref, { value });
    return value;
  });
  return `SL-REC-${new Date().getFullYear()}-${next.toString().padStart(4, '0')}`;
}

/** Saves the receipt (keyed by receipt number) and records the student against the admin who enrolled them. */
export async function saveReceiptCloud(receipt: ReceiptData, user: AppUser): Promise<void> {
  const stamped: ReceiptData = {
    ...receipt,
    createdBy: receipt.createdBy || user.username,
    createdByName: receipt.createdByName || user.displayName
  };
  await setDoc(doc(db, RECEIPTS, safeId(stamped.receiptNumber)), clean(stamped));
  await upsertStudent(stamped, user);
}

async function upsertStudent(receipt: ReceiptData, user: AppUser): Promise<void> {
  const studentId = receipt.studentId.trim();
  if (!studentId) return;
  const ref = doc(db, STUDENTS, safeId(studentId));
  const now = new Date().toISOString();
  const details = {
    studentId,
    name: receipt.studentName.trim(),
    phone: receipt.studentPhone.trim(),
    email: receipt.studentEmail || '',
    batch: receipt.batch,
    updatedAt: now
  };
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      // The admin who first added the student keeps the commission credit
      tx.update(ref, details);
    } else {
      const record: StudentRecord = {
        ...details,
        addedBy: user.username,
        addedByName: user.displayName,
        addedAt: now
      };
      tx.set(ref, clean(record));
    }
  });
}

export async function deleteReceiptCloud(receiptNumber: string): Promise<void> {
  await deleteDoc(doc(db, RECEIPTS, safeId(receiptNumber)));
}

/** Public lookup used by the QR verification page. */
export async function findReceiptByNumber(receiptNumber: string): Promise<ReceiptData | null> {
  const snap = await getDoc(doc(db, RECEIPTS, safeId(receiptNumber)));
  return snap.exists() ? (snap.data() as ReceiptData) : null;
}
