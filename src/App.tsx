/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  DEFAULT_INSTITUTE_INFO,
  InstituteInfo,
  ReceiptData,
  ReceiptItem
} from './types/receipt';
import {
  deleteReceipt,
  getNextReceiptNumber,
  getReceipts,
  getSavedInstituteInfo,
  saveInstituteInfo,
  saveReceipt,
  saveReceipts
} from './utils/storage';
import { formatCurrency } from './utils/numberToWords';
import { SmartLabsOfficialLogo } from './components/SmartLabsOfficialLogo';
import { ReceiptA5 } from './components/ReceiptA5';
import { DualA4PrintView } from './components/DualA4PrintView';
import { ReceiptForm } from './components/ReceiptForm';
import { ReceiptHistoryModal } from './components/ReceiptHistoryModal';
import { InstituteSettingsModal } from './components/InstituteSettingsModal';
import { DeviceStorageModal } from './components/DeviceStorageModal';
import { LoginScreen } from './components/LoginScreen';
import { AdminPanel } from './components/AdminPanel';
import { VerifyReceipt } from './components/VerifyReceipt';
import { downloadReceiptAsImage, exportReceiptAsJSON } from './utils/localSaver';
import { buildSnapshot, saveInvoiceToFolder, saveSnapshotToFolder } from './utils/deviceStore';
import {
  allocateReceiptNumber,
  deleteReceiptCloud,
  saveReceiptCloud,
  subscribeReceipts
} from './utils/cloudStore';
import { AppUser, loadSession, saveSession } from './utils/auth';
import {
  Building2,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileCode,
  FileDown,
  FileSpreadsheet,
  FileText,
  HardDrive,
  History,
  Info,
  Layers,
  LogOut,
  Phone,
  Printer,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Users
} from 'lucide-react';

const PENDING_RECEIPT_NUMBER = 'SL-REC-PENDING';

export default function App() {
  // A receipt QR code opens the app with ?verify=<receipt number>; that page is public
  const verifyNumber = new URLSearchParams(window.location.search).get('verify');
  const [user, setUser] = useState<AppUser | null>(() => loadSession());
  const [institute, setInstitute] = useState<InstituteInfo>(() => getSavedInstituteInfo());
  const [receipts, setReceipts] = useState<ReceiptData[]>(() => getReceipts());
  const [lastDeviceSave, setLastDeviceSave] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Keep the list in sync with the Firestore database (every computer sees the same records)
  useEffect(() => {
    if (!user || verifyNumber) return;
    return subscribeReceipts(cloud => {
      const sorted = [...cloud].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      saveReceipts(sorted);
      setReceipts(sorted);
    });
  }, [user, verifyNumber]);

  // Auto-save a snapshot to the linked device folder after every change
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const saved = await saveSnapshotToFolder(buildSnapshot(institute, receipts));
        if (saved) setLastDeviceSave(new Date().toISOString());
      } catch (err) {
        console.error('Auto-save to device folder failed', err);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [institute, receipts]);

  // Initial receipt state
  const createNewReceipt = (): ReceiptData => {
    const today = new Date().toISOString().split('T')[0];
    const hours = new Date().getHours().toString().padStart(2, '0');
    const minutes = new Date().getMinutes().toString().padStart(2, '0');
    // Temporary number until the database reserves the real one (see assignCloudNumber)
    const nextNo = getNextReceiptNumber();

    const initialItem: ReceiptItem = {
      id: 'item-' + Date.now(),
      category: 'Physical Class',
      description: 'Physical Class - In-Person Classroom Lectures',
      quantity: 1,
      unitPrice: 50000,
      amount: 50000
    };

    return {
      id: 'rec-' + Date.now(),
      receiptNumber: nextNo,
      type: 'Receipt',
      issueDate: today,
      issueTime: `${hours}:${minutes}`,
      studentName: '',
      studentId: `SL-STD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      studentPhone: '',
      batch: 'Batch 2026-A (Weekend)',
      cashierName: user?.displayName || institute.cashierName || 'SmartLabs Reception Counter 01',
      items: [initialItem],
      subtotal: 50000,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      total: 50000,
      amountPaid: 50000,
      balanceDue: 0,
      paymentMethod: 'Cash',
      createdAt: new Date().toISOString(),
      status: 'Paid in Full'
    };
  };

  const [receipt, setReceipt] = useState<ReceiptData>(createNewReceipt);
  const [previewMode, setPreviewMode] = useState<'a5-single' | 'a4-dual'>('a5-single');
  const [activePrintLayout, setActivePrintLayout] = useState<'a5-single' | 'a4-dual'>('a5-single');
  const [copyLabel, setCopyLabel] = useState<string>('STUDENT COPY');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeviceOpen, setIsDeviceOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);

  // Ask the database for a receipt number nobody else has used
  const assignCloudNumber = async (target: ReceiptData) => {
    try {
      const receiptNumber = await allocateReceiptNumber();
      setReceipt(current => (current.id === target.id ? { ...current, receiptNumber } : current));
    } catch (err) {
      console.error('Could not reserve a receipt number from the database', err);
    }
  };

  // Reserve a number for the first receipt right after login
  useEffect(() => {
    if (user && !verifyNumber) assignCloudNumber(receipt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Keep every invoice in the database and on the device: ledger + its own file in the linked folder
  // (or a downloaded JSON file when no folder is linked)
  const persistInvoice = async (rec: ReceiptData) => {
    const stamped: ReceiptData = {
      ...rec,
      createdBy: rec.createdBy || user?.username,
      createdByName: rec.createdByName || user?.displayName
    };
    if (user) {
      saveReceiptCloud(stamped, user).catch(err => {
        console.error('Saving receipt to database failed', err);
        alert('This receipt could not be saved to the database. Check the internet connection and save it again.');
      });
    }
    saveReceipt(stamped);
    setReceipts(getReceipts());
    try {
      const savedToFolder = await saveInvoiceToFolder(stamped);
      if (!savedToFolder) exportReceiptAsJSON(stamped);
    } catch (err) {
      console.error('Saving invoice to device failed', err);
      exportReceiptAsJSON(stamped);
    }
  };

  // Handle Save to Local Ledger
  const handleSaveReceipt = async () => {
    if (!receipt.studentName.trim()) {
      alert('Please enter the Student Full Name before saving.');
      return;
    }
    await persistInvoice(receipt);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Handle Download PNG Locally
  const handleDownloadPNG = async () => {
    const node = document.getElementById('receipt-a5-node');
    if (!node) {
      alert('Receipt preview is ready on screen. Downloading now...');
      return;
    }
    setDownloadingImage(true);
    const cleanName = (receipt.studentName || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `SmartLabs_Invoice_${receipt.receiptNumber}_${cleanName}`;
    const success = await downloadReceiptAsImage(node, filename);
    setDownloadingImage(false);
    if (success) {
      // Also record in ledger and on the device
      await persistInvoice(receipt);
    }
  };

  // Handle Download JSON Backup Locally
  const handleDownloadJSON = () => {
    exportReceiptAsJSON(receipt);
    saveReceipt(receipt);
    setReceipts(getReceipts());
  };

  // Handle Print A5
  const handlePrintA5 = (customReceipt?: ReceiptData) => {
    if (customReceipt) {
      setReceipt(customReceipt);
    }
    persistInvoice(customReceipt || receipt);
    setActivePrintLayout('a5-single');
    // Ensure state rendered before print dialog
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Handle Print Dual on A4
  const handlePrintDualA4 = (customReceipt?: ReceiptData) => {
    if (customReceipt) {
      setReceipt(customReceipt);
    }
    persistInvoice(customReceipt || receipt);
    setActivePrintLayout('a4-dual');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Handle Reset / New
  const handleReset = () => {
    const fresh = createNewReceipt();
    setReceipt(fresh);
    setSaveSuccess(false);
    assignCloudNumber(fresh);
  };

  const handleLogin = (loggedIn: AppUser) => {
    saveSession(loggedIn);
    setUser(loggedIn);
  };

  const handleLogout = () => {
    saveSession(null);
    setUser(null);
    setIsAdminOpen(false);
  };

  // Handle Settings Save
  const handleSaveSettings = (updated: InstituteInfo) => {
    setInstitute(updated);
    saveInstituteInfo(updated);
  };

  // Handle Delete
  const handleDeleteReceipt = (id: string) => {
    const target = receipts.find(r => r.id === id);
    const updated = deleteReceipt(id);
    setReceipts(updated);
    if (target) {
      deleteReceiptCloud(target.receiptNumber).catch(err => {
        console.error('Deleting receipt from database failed', err);
        alert('The receipt was removed on this computer but could not be removed from the database.');
      });
    }
  };

  // Load from History
  const handleSelectFromHistory = (selected: ReceiptData) => {
    setReceipt(selected);
  };

  if (verifyNumber) return <VerifyReceipt receiptNumber={verifyNumber} />;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* ========================================================
          PRINT CONTAINER (Visible ONLY when printing)
      ======================================================== */}
      <div id="print-root" className="print-only">
        {activePrintLayout === 'a5-single' ? (
          <div className="flex justify-center items-start">
            <ReceiptA5
              receipt={receipt}
              institute={institute}
              copyLabel={copyLabel}
              isPrintMode={true}
            />
          </div>
        ) : (
          <div className="flex justify-center items-start">
            <DualA4PrintView receipt={receipt} institute={institute} />
          </div>
        )}
      </div>

      {/* ========================================================
          SCREEN APPLICATION (Hidden during print)
      ======================================================== */}
      <div className="no-print flex-1 flex flex-col">
        {/* TOP BAR CONTRACT (Strict 3-zone architecture) */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between">
          {/* Zone 1: Brand single text element */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <SmartLabsOfficialLogo
                size="sm"
                customLogoUrl={institute.logoUrl}
                showSubtitle={false}
              />
            </div>

            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 pl-4 border-l border-slate-200">
              <span className="font-mono text-sky-600 font-semibold">{institute.website}</span>
              <span>·</span>
              <span>19/3 Poorwarama Rd, Nugegoda</span>
              <span>·</span>
              <span className="font-mono">{institute.phonePrimary}</span>
            </div>
          </div>

          {/* Zone 2: Navigation & Status indicator */}
          <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-700">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 rounded-full border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-700">A5 Thermal & Laser Certified</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-slate-500">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>{receipts.length} slips stored</span>
            </div>
          </div>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Panel</span>
            </button>

            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-sky-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>History Ledger</span>
            </button>

            <button
              onClick={() => setIsDeviceOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title={lastDeviceSave ? `Last auto-saved to device: ${new Date(lastDeviceSave).toLocaleTimeString()}` : 'Save & restore data on this device'}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Device Data</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100/60 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Official Institute Details & Contact Info"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SmartLabs Info</span>
            </button>

            <button
              onClick={() => handlePrintA5()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg shadow-sm shadow-sky-600/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A5</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title={`Log out ${user.displayName}`}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* SUB-HEADER INFO TICKER (Grounded Smartlabs Details) */}
        <div className="bg-white border-b border-slate-200 px-4 lg:px-8 py-2 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-slate-900">Smartlabs (Pvt) Ltd Official Billing Counter:</span>
            <span>📍 19/3 Poorwarama Rd, Nugegoda 10250</span>
            <span>·</span>
            <span>📞 070 491 4652 | 076 691 4650 | 077 453 3233</span>
            <span>·</span>
            <span>✉️ info@smartlabs.lk</span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span>Paper: <strong className="text-slate-900">A5 (148 × 210 mm)</strong></span>
            <span>·</span>
            <span>Mode: <strong className="text-sky-600">{previewMode === 'a5-single' ? 'Single A5' : 'Dual on A4'}</strong></span>
            <span>·</span>
            <span>User: <strong className="text-slate-900">{user.displayName}</strong></span>
            <span>·</span>
            <span>Authorized Admin: <strong className="text-slate-900">{institute.adminName || 'Not set'}</strong></span>
          </div>
        </div>

        {/* MAIN WORKSPACE: SPLIT DESKTOP VIEW */}
        <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5 lg:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: RECEIPT FORM GENERATOR (7 COLS ON XL) */}
          <section className="xl:col-span-7">
            <ReceiptForm
              receipt={receipt}
              onChange={setReceipt}
              onSave={handleSaveReceipt}
              onPrintA5={() => handlePrintA5()}
              onPrintDualA4={() => handlePrintDualA4()}
              onReset={handleReset}
              onDownloadPNG={handleDownloadPNG}
              onDownloadJSON={handleDownloadJSON}
              savedSuccess={saveSuccess}
            />
          </section>

          {/* RIGHT COLUMN: LIVE REAL-TIME PRINT PREVIEW (5 COLS ON XL) */}
          <section className="xl:col-span-5 sticky top-20 space-y-3">
            {/* Preview Toolbar */}
            <div className="bg-white border border-slate-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-600" />
                  Live Preview:
                </span>

                {/* View Switcher: A5 Single vs Dual A4 */}
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    onClick={() => setPreviewMode('a5-single')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      previewMode === 'a5-single'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    A5 Sheet
                  </button>
                  <button
                    onClick={() => setPreviewMode('a4-dual')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      previewMode === 'a4-dual'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Dual on A4
                  </button>
                </div>
              </div>

              {/* Copy label selector */}
              {previewMode === 'a5-single' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Copy:</span>
                  <select
                    value={copyLabel}
                    onChange={e => setCopyLabel(e.target.value)}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900"
                  >
                    <option value="STUDENT COPY">Student Copy</option>
                    <option value="INSTITUTE / OFFICE COPY">Office Copy</option>
                    <option value="ACCOUNTS COPY">Accounts Copy</option>
                  </select>
                </div>
              )}

              {/* Action Buttons: Save Local Image & Print */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPNG}
                  disabled={downloadingImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-sky-600 border border-slate-200 text-xs font-semibold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                  title="Save invoice as a high-resolution PNG image on your local computer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  {downloadingImage ? 'Saving...' : 'Save Image'}
                </button>

                <button
                  onClick={() => (previewMode === 'a5-single' ? handlePrintA5() : handlePrintDualA4())}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Now
                </button>
              </div>
            </div>

            {/* PREVIEW CANVAS CONTAINER */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-start overflow-x-auto min-h-[600px] shadow-2xl relative">
              <div className="text-[10px] text-slate-500 mb-2 font-mono flex items-center gap-2">
                <span>International Standard A5 (148mm × 210mm)</span>
                <span>·</span>
                <span>Exact Scale Preview</span>
              </div>

              {previewMode === 'a5-single' ? (
                <div className="w-full flex justify-center py-2">
                  <div className="transform transition-transform scale-[0.85] sm:scale-100 origin-top">
                    <ReceiptA5
                      receipt={receipt}
                      institute={institute}
                      copyLabel={copyLabel}
                      isPrintMode={false}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full flex justify-center py-2">
                  <div className="transform transition-transform scale-[0.65] sm:scale-[0.78] origin-top">
                    <DualA4PrintView receipt={receipt} institute={institute} />
                  </div>
                </div>
              )}
            </div>

            {/* QUICK COUNTER TIPS */}
            <div className="bg-white/60 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-500 space-y-1.5">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-600" />
                Counter Printing Tips:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                <li>
                  <strong>Direct A5 Printing:</strong> In the browser print dialog, select Paper Size as <span className="text-slate-900 font-mono">A5</span> and Margins as <span className="text-slate-900 font-mono">None</span>.
                </li>
                <li>
                  <strong>Dual 2-in-1 on A4:</strong> Switch to "Dual on A4" above to print 2 copies (Student + Office) on one regular A4 sheet and cut along the dashed line.
                </li>
                <li>
                  <strong>Verification QR:</strong> Students scan the QR code on the slip to check that the receipt is valid in the SmartLabs records.
                </li>
              </ul>
            </div>
          </section>
        </main>
      </div>

      {/* ========================================================
          MODALS
      ======================================================== */}
      {/* History Ledger Modal */}
      <ReceiptHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        receipts={receipts}
        onSelectReceipt={handleSelectFromHistory}
        onDeleteReceipt={handleDeleteReceipt}
        onPrintA5={handlePrintA5}
        onRefreshReceipts={() => setReceipts(getReceipts())}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        user={user}
        receipts={receipts}
      />

      {/* Local Device Data Modal */}
      <DeviceStorageModal
        isOpen={isDeviceOpen}
        onClose={() => setIsDeviceOpen(false)}
        receiptCount={receipts.length}
        onRestored={() => {
          setInstitute(getSavedInstituteInfo());
          setReceipts(getReceipts());
          setReceipt(createNewReceipt());
        }}
      />

      {/* Institute Info Settings Modal */}
      <InstituteSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        institute={institute}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
