import React, { useState } from 'react';
import {
  PaymentMethod,
  POPULAR_COURSES,
  QUICK_SESSION_PRESETS,
  ReceiptData,
  ReceiptItem,
  SessionCategory
} from '../types/receipt';
import { formatCurrency } from '../utils/numberToWords';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  FileCode,
  FileDown,
  FileText,
  HardDrive,
  Image as ImageIcon,
  Percent,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Share2,
  Trash2,
  User,
  Users
} from 'lucide-react';

interface ReceiptFormProps {
  receipt: ReceiptData;
  onChange: (updated: ReceiptData) => void;
  onSave: () => void;
  onPrintA5: () => void;
  onPrintDualA4: () => void;
  onReset: () => void;
  onDownloadPNG?: () => void;
  onDownloadJSON?: () => void;
  savedSuccess?: boolean;
}

export const ReceiptForm: React.FC<ReceiptFormProps> = ({
  receipt,
  onChange,
  onSave,
  onPrintA5,
  onPrintDualA4,
  onReset,
  onDownloadPNG,
  onDownloadJSON,
  savedSuccess = false
}) => {
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<SessionCategory>('Physical Class');
  const [customCourseInput, setCustomCourseInput] = useState<string>('');
  const [customFeeInput, setCustomFeeInput] = useState<number>(50000);

  // Helper to update receipt fields
  const updateField = <K extends keyof ReceiptData>(field: K, value: ReceiptData[K]) => {
    const updated = { ...receipt, [field]: value };
    recalculateFinancials(updated);
  };

  // Recalculate subtotal, discount, total, balance due
  const recalculateFinancials = (data: ReceiptData) => {
    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
    let discountAmount = 0;
    if (data.discountType === 'percentage') {
      discountAmount = (subtotal * (data.discountValue || 0)) / 100;
    } else {
      discountAmount = data.discountValue || 0;
    }
    const total = Math.max(0, subtotal - discountAmount);
    const balanceDue = Math.max(0, total - (data.amountPaid || 0));

    let status: 'Paid in Full' | 'Partial / Advance' | 'Pending' = 'Paid in Full';
    if (balanceDue === 0 && total > 0) {
      status = 'Paid in Full';
    } else if (data.amountPaid > 0 && balanceDue > 0) {
      status = 'Partial / Advance';
    } else {
      status = 'Pending';
    }

    onChange({
      ...data,
      subtotal,
      discountAmount,
      total,
      balanceDue,
      status
    });
  };

  // Add line item from quick presets
  const handleAddPresetItem = (preset: typeof QUICK_SESSION_PRESETS[0]) => {
    const newItem: ReceiptItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      category: preset.category,
      description: preset.defaultTitle,
      quantity: 1,
      unitPrice: preset.typicalFee,
      amount: preset.typicalFee
    };

    const newItems = [...receipt.items, newItem];
    const updated = { ...receipt, items: newItems };
    recalculateFinancials(updated);
  };

  // Add custom line item
  const handleAddCustomCourse = () => {
    const title = customCourseInput.trim() || `${selectedQuickCategory}: SmartLabs Module`;
    const newItem: ReceiptItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      category: selectedQuickCategory,
      description: title,
      quantity: 1,
      unitPrice: customFeeInput > 0 ? customFeeInput : 5000,
      amount: customFeeInput > 0 ? customFeeInput : 5000
    };

    const newItems = [...receipt.items, newItem];
    const updated = { ...receipt, items: newItems };
    recalculateFinancials(updated);
    setCustomCourseInput('');
  };

  // Update item
  const handleUpdateItem = (index: number, updates: Partial<ReceiptItem>) => {
    const updatedItems = [...receipt.items];
    const current = updatedItems[index];
    const modified = { ...current, ...updates };

    // Update line amount if quantity or unitPrice changed
    if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
      modified.amount = (modified.quantity || 1) * (modified.unitPrice || 0);
    }

    updatedItems[index] = modified;
    recalculateFinancials({ ...receipt, items: updatedItems });
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    const updatedItems = receipt.items.filter((_, idx) => idx !== index);
    recalculateFinancials({ ...receipt, items: updatedItems });
  };

  // Fast payment shortcuts
  const handleSetFullPayment = () => {
    const updated = { ...receipt, amountPaid: receipt.total, balanceDue: 0, status: 'Paid in Full' as const };
    onChange(updated);
  };

  const handleSetHalfPayment = () => {
    const half = Math.round(receipt.total / 2);
    const balance = receipt.total - half;
    const nextWeek = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
    const updated = {
      ...receipt,
      amountPaid: half,
      balanceDue: balance,
      balanceDueDate: nextWeek,
      status: 'Partial / Advance' as const
    };
    onChange(updated);
  };

  const handleApplyDiscountPreset = (pct: number) => {
    const updated = {
      ...receipt,
      discountType: 'percentage' as const,
      discountValue: pct
    };
    recalculateFinancials(updated);
  };

  // Generate WhatsApp Message Link
  const handleWhatsAppShare = () => {
    const phone = receipt.studentPhone.replace(/[^0-9]/g, '');
    let cleanPhone = phone;
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '94' + cleanPhone.substring(1);
    }

    const itemsSummary = receipt.items.map(i => `• ${i.description} (LKR ${formatCurrency(i.amount)})`).join('\n');
    const text = `*SMARTLABS (PVT) LTD - OFFICIAL RECEIPT*\n` +
      `Receipt No: *${receipt.receiptNumber}*\n` +
      `Date: ${receipt.issueDate} ${receipt.issueTime}\n\n` +
      `Student: *${receipt.studentName}*\n` +
      `Student ID: ${receipt.studentId}\n` +
      `Batch: ${receipt.batch}\n\n` +
      `*Payment Details:*\n${itemsSummary}\n\n` +
      `Total: LKR ${formatCurrency(receipt.total)}\n` +
      `*Amount Paid: LKR ${formatCurrency(receipt.amountPaid)}*\n` +
      (receipt.balanceDue > 0 ? `*Balance Due: LKR ${formatCurrency(receipt.balanceDue)}* (Due: ${receipt.balanceDueDate || 'Next Session'})\n` : `Status: *PAID IN FULL* ✅\n`) +
      `Payment Method: ${receipt.paymentMethod}\n\n` +
      `Thank you for learning with SmartLabs!\n` +
      `📍 19/3 Poorwarama Rd, Nugegoda\n` +
      `📞 070 491 4652 | 076 691 4650 | 077 453 3233\n` +
      `🌐 www.smartlabs.lk`;

    const url = `https://wa.me/${cleanPhone ? cleanPhone : ''}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-6 shadow-xl text-slate-900">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            Billing & Receipt Generator
          </h2>
          <p className="text-xs text-slate-500">
            Create standard A5 receipts with Smartlabs (Pvt) Ltd branding & student tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Receipt
          </button>

          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-sm shadow-sky-600/30 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save to Ledger
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50/80 border border-emerald-300 text-emerald-700 px-3.5 py-2 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Receipt successfully recorded in counter ledger! Ready for print or sharing.</span>
        </div>
      )}

      {/* METADATA BAR: RECEIPT NUMBER, TYPE, DATE */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white/60 p-3.5 rounded-lg border border-slate-200">
        <div>
          <label className="text-[11px] font-medium text-slate-500 block mb-1">Receipt Number</label>
          <input
            type="text"
            value={receipt.receiptNumber}
            onChange={e => updateField('receiptNumber', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-sky-600 focus:outline-none focus:border-sky-300"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-500 block mb-1">Document Type</label>
          <select
            value={receipt.type}
            onChange={e => updateField('type', e.target.value as ReceiptData['type'])}
            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-300"
          >
            <option value="Receipt">Payment Receipt</option>
            <option value="Invoice">Student Invoice</option>
            <option value="Bill">Class Bill</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-500 block mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            Issue Date
          </label>
          <input
            type="date"
            value={receipt.issueDate}
            onChange={e => updateField('issueDate', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-300"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-500 block mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            Time
          </label>
          <input
            type="time"
            value={receipt.issueTime}
            onChange={e => updateField('issueTime', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-300"
          />
        </div>
      </div>

      {/* STUDENT INFORMATION */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-sky-600" />
          Student Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="text-[11px] font-medium text-slate-700 block mb-1">
              Student Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Kasun Dananjaya Perera"
              value={receipt.studentName}
              onChange={e => updateField('studentName', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-300 font-medium"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="text-[11px] font-medium text-slate-700 block mb-1">
              Student ID / Reg No
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="SL-STD-2026-..."
                value={receipt.studentId}
                onChange={e => updateField('studentId', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-300"
              />
              <button
                type="button"
                title="Auto Generate Student ID"
                onClick={() => {
                  const id = `SL-STD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
                  updateField('studentId', id);
                }}
                className="px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] text-slate-700"
              >
                Auto
              </button>
            </div>
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] font-medium text-slate-700 block mb-1">
              Contact / WhatsApp No <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              placeholder="07x xxx xxxx"
              value={receipt.studentPhone}
              onChange={e => updateField('studentPhone', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-300"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="text-[11px] font-medium text-slate-700 block mb-1">
              Batch / Intake / Schedule
            </label>
            <input
              type="text"
              placeholder="e.g. Batch 2026-A (Weekend) or Sunday 9AM"
              value={receipt.batch}
              onChange={e => updateField('batch', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-300"
            />
          </div>

          <div className="sm:col-span-6">
            <label className="text-[11px] font-medium text-slate-700 block mb-1">
              Student Email (Optional)
            </label>
            <input
              type="email"
              placeholder="student@gmail.com"
              value={receipt.studentEmail || ''}
              onChange={e => updateField('studentEmail', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-300"
            />
          </div>
        </div>
      </div>

      {/* QUICK PRESET CHIPS (Requested by user: recorded sessions, individual session, physical class, etc.) */}
      <div className="space-y-3 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-sky-600" />
            Quick Add Session / Service Presets
          </h3>
          <span className="text-[11px] text-slate-500">1-Click to add item</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {QUICK_SESSION_PRESETS.map(preset => (
            <button
              key={preset.category}
              type="button"
              onClick={() => handleAddPresetItem(preset)}
              className="flex flex-col text-left p-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 hover:border-sky-300 transition-all group cursor-pointer"
            >
              <span className="text-[11px] font-bold text-sky-700 group-hover:text-sky-700">
                + {preset.label}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 font-mono">
                LKR {formatCurrency(preset.typicalFee)}
              </span>
            </button>
          ))}
        </div>

        {/* CUSTOM COURSE ENTRY */}
        <div className="p-3 bg-white/80 border border-slate-200 rounded-lg space-y-2">
          <span className="text-[11px] font-semibold text-slate-700 block">
            Or Enter Specific Course & Fee:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-3">
              <select
                value={selectedQuickCategory}
                onChange={e => setSelectedQuickCategory(e.target.value as SessionCategory)}
                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900"
              >
                <option value="Physical Class">Physical Class</option>
                <option value="Recorded Sessions">Recorded Sessions</option>
                <option value="Individual Session">Individual Session</option>
                <option value="Group Online Class">Group Online Class</option>
                <option value="Workshop & Bootcamp">Workshop & Bootcamp</option>
                <option value="Admission Fee">Admission Fee</option>
                <option value="Custom">Custom Service</option>
              </select>
            </div>

            <div className="sm:col-span-5 relative">
              <input
                type="text"
                list="popular-courses"
                placeholder="Course name or description..."
                value={customCourseInput}
                onChange={e => setCustomCourseInput(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400"
              />
              <datalist id="popular-courses">
                {POPULAR_COURSES.map(course => (
                  <option key={course} value={course} />
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-2">
              <input
                type="number"
                placeholder="Fee (LKR)"
                value={customFeeInput || ''}
                onChange={e => setCustomFeeInput(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono text-slate-900 placeholder-slate-400 text-right"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={handleAddCustomCourse}
                className="w-full h-full flex items-center justify-center gap-1 bg-sky-700 hover:bg-sky-600 text-white rounded text-xs font-semibold px-2 py-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ITEMS LIST (TABLE VIEW IN FORM) */}
      <div className="space-y-3 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Receipt Line Items ({receipt.items.length})
          </h3>
          {receipt.items.length === 0 && (
            <span className="text-[11px] text-amber-400">Please add at least one course or fee item</span>
          )}
        </div>

        <div className="space-y-2">
          {receipt.items.map((item, idx) => (
            <div
              key={item.id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200"
            >
              <div className="sm:col-span-5">
                <input
                  type="text"
                  value={item.description}
                  onChange={e => handleUpdateItem(idx, { description: e.target.value })}
                  placeholder="Item description"
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <select
                  value={item.category}
                  onChange={e => handleUpdateItem(idx, { category: e.target.value as SessionCategory })}
                  className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-[11px] text-sky-700"
                >
                  <option value="Physical Class">Physical Class</option>
                  <option value="Recorded Sessions">Recorded Sessions</option>
                  <option value="Individual Session">Individual Session</option>
                  <option value="Group Online Class">Group Online</option>
                  <option value="Workshop & Bootcamp">Workshop</option>
                  <option value="Admission Fee">Admission</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div className="sm:col-span-1 flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => handleUpdateItem(idx, { quantity: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-900 text-center font-mono"
                  title="Quantity"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  step="500"
                  value={item.unitPrice}
                  onChange={e => handleUpdateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-900 text-right"
                  title="Unit Price"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between pl-1">
                <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                  LKR {formatCurrency(item.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="text-slate-500 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition-colors"
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FINANCIAL SETTLEMENT: PAYMENT METHOD, DISCOUNT, AMOUNT PAID */}
      <div className="space-y-4 pt-2 border-t border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-sky-600" />
          Payment Settlement & Balances
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-white/60 p-4 rounded-xl border border-slate-200">
          {/* Payment Method & Reference */}
          <div className="sm:col-span-6 space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Cash', 'Bank Transfer', 'Online / QR', 'Card'] as PaymentMethod[]).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => updateField('paymentMethod', method)}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all text-center cursor-pointer ${
                      receipt.paymentMethod === method
                        ? 'bg-sky-600 border-sky-400 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {receipt.paymentMethod !== 'Cash' && (
              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Bank Reference / Slip No / Transaction ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. Commercial Bank Dep Ref #992831"
                  value={receipt.paymentReference || ''}
                  onChange={e => updateField('paymentReference', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 font-mono"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-slate-700 block mb-1">
                Cashier / Counter Officer Note
              </label>
              <input
                type="text"
                placeholder="e.g. Full settlement. Course pack issued."
                value={receipt.notes || ''}
                onChange={e => updateField('notes', e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Numerical Settlement Panel */}
          <div className="sm:col-span-6 space-y-3 bg-white/70 p-3.5 rounded-lg border border-slate-200">
            {/* Discount selector */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-700 flex items-center gap-1">
                <Percent className="w-3 h-3 text-slate-500" />
                Discount / Offer:
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 5, 10, 15].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleApplyDiscountPreset(pct)}
                    className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                      receipt.discountType === 'percentage' && receipt.discountValue === pct
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pct === 0 ? 'None' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Subtotal & Net Total */}
            <div className="flex justify-between items-center text-xs text-slate-500 pt-1 border-t border-slate-200">
              <span>Subtotal:</span>
              <span className="font-mono tabular-nums text-slate-900">
                LKR {formatCurrency(receipt.subtotal)}
              </span>
            </div>

            {receipt.discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs text-emerald-600 font-medium">
                <span>Discount Applied:</span>
                <span className="font-mono tabular-nums">
                  - LKR {formatCurrency(receipt.discountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
              <span>Total Payable:</span>
              <span className="font-mono tabular-nums text-sky-600">
                LKR {formatCurrency(receipt.total)}
              </span>
            </div>

            {/* Amount Paid Input & Quick Buttons */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-900">
                  Amount Paying Now (LKR):
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleSetFullPayment}
                    className="text-[10px] bg-sky-100/60 hover:bg-sky-200 text-sky-700 px-2 py-0.5 rounded font-medium cursor-pointer"
                  >
                    100% Full
                  </button>
                  <button
                    type="button"
                    onClick={handleSetHalfPayment}
                    className="text-[10px] bg-amber-100/60 hover:bg-amber-200 text-amber-700 px-2 py-0.5 rounded font-medium cursor-pointer"
                  >
                    50% Advance
                  </button>
                </div>
              </div>
              <input
                type="number"
                value={receipt.amountPaid}
                onChange={e => {
                  const paid = parseFloat(e.target.value) || 0;
                  const bal = Math.max(0, receipt.total - paid);
                  onChange({
                    ...receipt,
                    amountPaid: paid,
                    balanceDue: bal,
                    status: bal <= 0 ? 'Paid in Full' : 'Partial / Advance'
                  });
                }}
                className="w-full bg-white border border-sky-300 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* Balance Due Display & Due Date */}
            <div
              className={`p-2.5 rounded-lg border flex flex-col gap-1.5 ${
                receipt.balanceDue > 0
                  ? 'bg-rose-50/40 border-rose-200 text-rose-700'
                  : 'bg-emerald-50/40 border-emerald-200 text-emerald-700'
              }`}
            >
              <div className="flex justify-between items-center text-xs font-bold">
                <span>{receipt.balanceDue > 0 ? 'Balance Due:' : 'Status:'}</span>
                <span className="font-mono text-sm tabular-nums">
                  {receipt.balanceDue > 0
                    ? `LKR ${formatCurrency(receipt.balanceDue)}`
                    : 'FULLY SETTLED ✅'}
                </span>
              </div>

              {receipt.balanceDue > 0 && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-rose-900/60">
                  <span className="text-rose-700 font-medium">Balance Settlement Due:</span>
                  <input
                    type="date"
                    value={receipt.balanceDueDate || ''}
                    onChange={e => updateField('balanceDueDate', e.target.value)}
                    className="bg-white border border-rose-200 rounded px-2 py-0.5 text-xs text-slate-900"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BAR: PRINT A5, PRINT DUAL A4, WHATSAPP, LOCAL SAVE */}
      <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPrintA5}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Single A5 Receipt
          </button>

          <button
            type="button"
            onClick={onPrintDualA4}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            title="Print 2 copies (Student Copy & Office Copy) on 1 A4 sheet"
          >
            <Users className="w-4 h-4" />
            Print Dual on A4 (2 Copies)
          </button>

          {onDownloadPNG && (
            <button
              type="button"
              onClick={onDownloadPNG}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-sky-600 border border-slate-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
              title="Download high-resolution A5 receipt image file (.png) locally"
            >
              <FileDown className="w-3.5 h-3.5" />
              Save as Image (.png)
            </button>
          )}

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            title="Send formatted receipt slip to student WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            Send WhatsApp Slip
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onDownloadJSON && (
            <button
              type="button"
              onClick={onDownloadJSON}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs transition-colors cursor-pointer"
              title="Download local JSON invoice backup"
            >
              <FileCode className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 rounded-lg font-medium text-xs transition-colors cursor-pointer"
            title="Save permanently to browser local database"
          >
            <HardDrive className="w-3.5 h-3.5 text-sky-600" />
            Save to Local Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
