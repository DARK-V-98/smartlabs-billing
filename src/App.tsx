/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  saveReceipt
} from './utils/storage';
import { formatCurrency } from './utils/numberToWords';
import { SmartLabsOfficialLogo } from './components/SmartLabsOfficialLogo';
import { ReceiptA5 } from './components/ReceiptA5';
import { DualA4PrintView } from './components/DualA4PrintView';
import { ReceiptForm } from './components/ReceiptForm';
import { ReceiptHistoryModal } from './components/ReceiptHistoryModal';
import { InstituteSettingsModal } from './components/InstituteSettingsModal';
import { downloadReceiptAsImage, exportReceiptAsJSON } from './utils/localSaver';
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
  Phone,
  Printer,
  Settings,
  Share2,
  Sparkles,
  Users
} from 'lucide-react';

export default function App() {
  const [institute, setInstitute] = useState<InstituteInfo>(() => getSavedInstituteInfo());
  const [receipts, setReceipts] = useState<ReceiptData[]>(() => getReceipts());

  // Initial receipt state
  const createNewReceipt = (): ReceiptData => {
    const today = new Date().toISOString().split('T')[0];
    const hours = new Date().getHours().toString().padStart(2, '0');
    const minutes = new Date().getMinutes().toString().padStart(2, '0');
    const nextNo = getNextReceiptNumber();

    const initialItem: ReceiptItem = {
      id: 'item-' + Date.now(),
      category: 'Physical Class',
      description: 'Physical Class - In-Person Lab & Classroom Lectures',
      quantity: 1,
      unitPrice: 12000,
      amount: 12000
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
      cashierName: institute.cashierName || 'SmartLabs Reception Counter 01',
      items: [initialItem],
      subtotal: 12000,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      total: 12000,
      amountPaid: 12000,
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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);

  // Handle Save to Local Ledger
  const handleSaveReceipt = () => {
    if (!receipt.studentName.trim()) {
      alert('Please enter the Student Full Name before saving.');
      return;
    }
    saveReceipt(receipt);
    setReceipts(getReceipts());
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
      // Also record in ledger automatically
      saveReceipt(receipt);
      setReceipts(getReceipts());
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
    setActivePrintLayout('a4-dual');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Handle Reset / New
  const handleReset = () => {
    setReceipt(createNewReceipt());
    setSaveSuccess(false);
  };

  // Handle Settings Save
  const handleSaveSettings = (updated: InstituteInfo) => {
    setInstitute(updated);
    saveInstituteInfo(updated);
  };

  // Handle Delete
  const handleDeleteReceipt = (id: string) => {
    const updated = deleteReceipt(id);
    setReceipts(updated);
  };

  // Load from History
  const handleSelectFromHistory = (selected: ReceiptData) => {
    setReceipt(selected);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
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
        <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 flex items-center justify-between">
          {/* Zone 1: Brand single text element */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <SmartLabsOfficialLogo
                size="sm"
                customLogoUrl={institute.logoUrl}
                showSubtitle={false}
              />
            </div>

            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-400 pl-4 border-l border-slate-800">
              <span className="font-mono text-sky-400 font-semibold">{institute.website}</span>
              <span>·</span>
              <span>19/3 Poorwarama Rd, Nugegoda</span>
              <span>·</span>
              <span className="font-mono">{institute.phonePrimary}</span>
            </div>
          </div>

          {/* Zone 2: Navigation & Status indicator */}
          <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-300">A5 Thermal & Laser Certified</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>{receipts.length} slips stored</span>
            </div>
          </div>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>History Ledger</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
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
          </div>
        </header>

        {/* SUB-HEADER INFO TICKER (Grounded Smartlabs Details) */}
        <div className="bg-slate-900 border-b border-slate-800/70 px-4 lg:px-8 py-2 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold text-slate-200">Smartlabs (Pvt) Ltd Official Billing Counter:</span>
            <span>📍 19/3 Poorwarama Rd, Nugegoda 10250</span>
            <span>·</span>
            <span>📞 070 491 4652 | 076 691 4650 | 077 453 3233</span>
            <span>·</span>
            <span>✉️ info@smartlabs.lk</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span>Paper: <strong className="text-white">A5 (148 × 210 mm)</strong></span>
            <span>·</span>
            <span>Mode: <strong className="text-sky-400">{previewMode === 'a5-single' ? 'Single A5' : 'Dual on A4'}</strong></span>
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
            <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  Live Preview:
                </span>

                {/* View Switcher: A5 Single vs Dual A4 */}
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    onClick={() => setPreviewMode('a5-single')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      previewMode === 'a5-single'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    A5 Sheet
                  </button>
                  <button
                    onClick={() => setPreviewMode('a4-dual')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      previewMode === 'a4-dual'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Dual on A4
                  </button>
                </div>
              </div>

              {/* Copy label selector */}
              {previewMode === 'a5-single' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Copy:</span>
                  <select
                    value={copyLabel}
                    onChange={e => setCopyLabel(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-semibold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
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
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-start overflow-x-auto min-h-[600px] shadow-2xl relative">
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
            <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl text-xs text-slate-400 space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                Counter Printing Tips:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                <li>
                  <strong>Direct A5 Printing:</strong> In the browser print dialog, select Paper Size as <span className="text-white font-mono">A5</span> and Margins as <span className="text-white font-mono">None</span>.
                </li>
                <li>
                  <strong>Dual 2-in-1 on A4:</strong> Switch to "Dual on A4" above to print 2 copies (Student + Office) on one regular A4 sheet and cut along the dashed line.
                </li>
                <li>
                  <strong>Verification QR:</strong> The QR code at the bottom encodes the student record, receipt number, and direct link to <span className="text-sky-400 font-mono">www.smartlabs.lk</span>.
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
