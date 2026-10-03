import { InstituteInfo, ReceiptData } from '../types/receipt';
import {
  getReceiptCounter,
  getReceipts,
  getSavedInstituteInfo,
  saveInstituteInfo,
  saveReceipts,
  setReceiptCounter
} from './storage';

/**
 * Local-device data storage.
 *
 * - Data always lives in the browser (localStorage) for instant access.
 * - Optionally, the user links a folder on their computer. Every change is then
 *   auto-saved as a JSON snapshot in that folder (File System Access API, Chrome/Edge).
 * - Snapshots can also be downloaded manually and restored from a file.
 */

export const SNAPSHOT_FILE_NAME = 'smartlabs-data.json';
const SNAPSHOT_FORMAT = 'smartlabs-billing';
const SNAPSHOT_VERSION = 1;

const DB_NAME = 'smartlabs_device';
const DB_STORE = 'handles';
const DB_KEY = 'backupFolder';

export interface DeviceSnapshot {
  format: typeof SNAPSHOT_FORMAT;
  version: number;
  savedAt: string;
  institute: InstituteInfo;
  receipts: ReceiptData[];
  receiptCounter: number;
}

// Minimal typing for the File System Access API (not in every TS lib)
type DirHandle = FileSystemDirectoryHandle & {
  queryPermission: (d: { mode: 'readwrite' }) => Promise<PermissionState>;
  requestPermission: (d: { mode: 'readwrite' }) => Promise<PermissionState>;
};

export const isFolderSaveSupported = (): boolean =>
  typeof window !== 'undefined' && typeof (window as any).showDirectoryPicker === 'function';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function readHandle(): Promise<DirHandle | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(DB_KEY);
      req.onsuccess = () => resolve((req.result as DirHandle) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function writeHandle(handle: DirHandle | null): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    if (handle) tx.objectStore(DB_STORE).put(handle, DB_KEY);
    else tx.objectStore(DB_STORE).delete(DB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLinkedFolder(): Promise<{ name: string; writable: boolean } | null> {
  const handle = await readHandle();
  if (!handle) return null;
  const perm = await handle.queryPermission({ mode: 'readwrite' });
  return { name: handle.name, writable: perm === 'granted' };
}

/** Ask the user for a folder and remember it. Must be called from a click. */
export async function linkBackupFolder(): Promise<string> {
  const handle = (await (window as any).showDirectoryPicker({ mode: 'readwrite', id: 'smartlabs-data' })) as DirHandle;
  await handle.requestPermission({ mode: 'readwrite' });
  await writeHandle(handle);
  return handle.name;
}

/** Re-grant write access to the linked folder after a page reload. Must be called from a click. */
export async function grantLinkedFolderAccess(): Promise<boolean> {
  const handle = await readHandle();
  if (!handle) return false;
  return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted';
}

export async function unlinkBackupFolder(): Promise<void> {
  await writeHandle(null);
}

export function buildSnapshot(institute: InstituteInfo, receipts: ReceiptData[]): DeviceSnapshot {
  return {
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    savedAt: new Date().toISOString(),
    institute,
    receipts,
    receiptCounter: getReceiptCounter()
  };
}

/** Write the snapshot into the linked folder. Returns false if no folder or no permission. */
export async function saveSnapshotToFolder(snapshot: DeviceSnapshot): Promise<boolean> {
  const handle = await readHandle();
  if (!handle) return false;
  if ((await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') return false;

  const fileHandle = await handle.getFileHandle(SNAPSHOT_FILE_NAME, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(snapshot, null, 2));
  await writable.close();
  return true;
}

/** Download the snapshot as a file (works in every browser). */
export function downloadSnapshot(snapshot: DeviceSnapshot): void {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SmartLabs_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Read and validate a snapshot file chosen by the user. */
export function readSnapshotFile(file: File): Promise<DeviceSnapshot> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed?.format !== SNAPSHOT_FORMAT || !Array.isArray(parsed.receipts)) {
          throw new Error('This file is not a SmartLabs backup.');
        }
        resolve(parsed as DeviceSnapshot);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/** Replace local data with a snapshot. Callers should reload their state afterwards. */
export function restoreSnapshot(snapshot: DeviceSnapshot): void {
  saveInstituteInfo({ ...getSavedInstituteInfo(), ...snapshot.institute });
  saveReceipts(snapshot.receipts);
  setReceiptCounter(snapshot.receiptCounter || 1041);
}

export function currentSnapshot(): DeviceSnapshot {
  return buildSnapshot(getSavedInstituteInfo(), getReceipts());
}

async function writeTextFile(dir: FileSystemDirectoryHandle, name: string, data: string): Promise<void> {
  const fileHandle = await dir.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

/**
 * Save one invoice as its own JSON file in the linked folder's "invoices" subfolder.
 * Returns false when no folder is linked or write permission is missing.
 */
export async function saveInvoiceToFolder(receipt: ReceiptData): Promise<boolean> {
  const handle = await readHandle();
  if (!handle) return false;
  if ((await handle.queryPermission({ mode: 'readwrite' })) !== 'granted') return false;

  const invoices = await handle.getDirectoryHandle('invoices', { create: true });
  const safeNumber = receipt.receiptNumber.replace(/[^a-zA-Z0-9-]/g, '_');
  await writeTextFile(invoices, `${safeNumber}.json`, JSON.stringify(receipt, null, 2));
  return true;
}
