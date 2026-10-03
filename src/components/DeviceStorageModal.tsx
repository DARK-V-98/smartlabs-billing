import React, { useEffect, useState } from 'react';
import { FolderOpen, Download, Upload, RefreshCw, Unlink, X, HardDrive, ShieldCheck } from 'lucide-react';
import {
  currentSnapshot,
  downloadSnapshot,
  getLinkedFolder,
  grantLinkedFolderAccess,
  isFolderSaveSupported,
  linkBackupFolder,
  readSnapshotFile,
  restoreSnapshot,
  SNAPSHOT_FILE_NAME,
  unlinkBackupFolder
} from '../utils/deviceStore';

interface DeviceStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void;
  receiptCount: number;
}

export const DeviceStorageModal: React.FC<DeviceStorageModalProps> = ({
  isOpen,
  onClose,
  onRestored,
  receiptCount
}) => {
  const [folder, setFolder] = useState<{ name: string; writable: boolean } | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const supported = isFolderSaveSupported();

  const refresh = async () => setFolder(await getLinkedFolder());

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      refresh();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    try {
      await task();
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setMessage({ type: 'error', text: err?.message || 'Something went wrong.' });
      }
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  const handleLink = () =>
    run(async () => {
      const name = await linkBackupFolder();
      setMessage({ type: 'ok', text: `Linked folder "${name}". Every change is now saved to ${SNAPSHOT_FILE_NAME} there.` });
    });

  const handleGrant = () =>
    run(async () => {
      const ok = await grantLinkedFolderAccess();
      setMessage(ok
        ? { type: 'ok', text: 'Auto-save is active for the linked folder.' }
        : { type: 'error', text: 'Permission was not granted for the folder.' });
    });

  const handleUnlink = () =>
    run(async () => {
      await unlinkBackupFolder();
      setMessage({ type: 'ok', text: 'Folder unlinked. Data stays in this browser only.' });
    });

  const handleBackupNow = () => {
    downloadSnapshot(currentSnapshot());
    setMessage({ type: 'ok', text: 'Backup file downloaded.' });
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    run(async () => {
      const snapshot = await readSnapshotFile(file);
      if (!window.confirm(`Restore ${snapshot.receipts.length} receipts from this backup? Current local data will be replaced.`)) {
        return;
      }
      restoreSnapshot(snapshot);
      onRestored();
      setMessage({ type: 'ok', text: `Restored ${snapshot.receipts.length} receipts.` });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-lg text-slate-900">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Local Device Data</h2>
              <p className="text-[11px] text-slate-500">{receiptCount} receipts stored in this browser</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {/* Auto-save folder */}
          <section className="space-y-2">
            <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-sky-600" /> Auto-save folder on this computer
            </h3>
            {!supported && (
              <p className="text-slate-500">
                Auto-save to a folder needs Chrome or Edge. You can still use manual backup below.
              </p>
            )}
            {supported && folder && (
              <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <div className="font-mono font-semibold text-slate-900 truncate">{folder.name}</div>
                  <div className={folder.writable ? 'text-emerald-700' : 'text-amber-700'}>
                    {folder.writable ? 'Auto-saving to ' + SNAPSHOT_FILE_NAME : 'Click "Enable auto-save" to continue saving'}
                  </div>
                </div>
                <button onClick={handleUnlink} disabled={busy} className="p-1.5 text-slate-500 hover:text-rose-600 cursor-pointer" title="Unlink folder">
                  <Unlink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {supported && (
              <div className="flex flex-wrap gap-2">
                {folder && !folder.writable && (
                  <button onClick={handleGrant} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg cursor-pointer disabled:opacity-50">
                    <ShieldCheck className="w-3.5 h-3.5" /> Enable auto-save
                  </button>
                )}
                <button onClick={handleLink} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-lg cursor-pointer disabled:opacity-50">
                  <RefreshCw className="w-3.5 h-3.5" /> {folder ? 'Choose another folder' : 'Choose folder'}
                </button>
              </div>
            )}
          </section>

          {/* Manual backup / restore */}
          <section className="space-y-2 pt-4 border-t border-slate-200">
            <h3 className="font-semibold text-slate-800">Backup & restore file</h3>
            <p className="text-slate-500">Includes receipts, institute settings, users and the receipt counter.</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleBackupNow} className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-lg cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Download backup
              </button>
              <label className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-lg cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Restore from file
                <input type="file" accept="application/json,.json" onChange={handleRestore} className="hidden" disabled={busy} />
              </label>
            </div>
          </section>

          {message && (
            <div className={`px-3 py-2 rounded-lg border ${message.type === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
