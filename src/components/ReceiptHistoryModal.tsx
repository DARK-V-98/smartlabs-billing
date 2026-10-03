import React, { useMemo, useState } from 'react';
import { ReceiptData } from '../types/receipt';
import { formatCurrency } from '../utils/numberToWords';
import { exportReceiptsToCSV } from '../utils/storage';
import {
  exportAllReceiptsJSON,
  exportReceiptAsJSON,
  importReceiptsFromJSON
} from '../utils/localSaver';
import {
  Download,
  Eye,
  FileCode,
  FileSpreadsheet,
  HardDrive,
  History,
  Printer,
  Search,
  Share2,
  Trash2,
  Upload,
  X
} from 'lucide-react';

interface ReceiptHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipts: ReceiptData[];
  onSelectReceipt: (receipt: ReceiptData) => void;
  onDeleteReceipt: (id: string) => void;
  onPrintA5: (receipt: ReceiptData) => void;
  onRefreshReceipts?: () => void;
}

export const ReceiptHistoryModal: React.FC<ReceiptHistoryModalProps> = ({
  isOpen,
  onClose,
  receipts,
  onSelectReceipt,
  onDeleteReceipt,
  onPrintA5,
  onRefreshReceipts
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid in Full' | 'Partial / Advance'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today'>('all');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await importReceiptsFromJSON(file);
        setImportStatus(`Successfully restored ${result.count} invoice records locally!`);
        if (onRefreshReceipts) onRefreshReceipts();
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err) {
        alert('Failed to parse backup file. Please ensure it is a valid SmartLabs JSON backup.');
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered list
  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      // Date filter
      if (dateFilter === 'today' && r.issueDate !== todayStr) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.studentName.toLowerCase().includes(q);
        const matchesNo = r.receiptNumber.toLowerCase().includes(q);
        const matchesPhone = r.studentPhone.toLowerCase().includes(q);
        const matchesId = r.studentId.toLowerCase().includes(q);
        const matchesCourse = r.items.some(i => i.description.toLowerCase().includes(q));
        return matchesName || matchesNo || matchesPhone || matchesId || matchesCourse;
      }
      return true;
    });
  }, [receipts, searchQuery, statusFilter, dateFilter, todayStr]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const todayReceipts = receipts.filter(r => r.issueDate === todayStr);
    const totalCollectedToday = todayReceipts.reduce((sum, r) => sum + r.amountPaid, 0);
    const totalOutstanding = receipts.reduce((sum, r) => sum + r.balanceDue, 0);
    return {
      todayCount: todayReceipts.length,
      todayCollected: totalCollectedToday,
      totalOutstanding,
      allCount: receipts.length
    };
  }, [receipts, todayStr]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-900">
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-300 flex items-center justify-center text-sky-600">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">SmartLabs Receipt Ledger & Records</h2>
              <p className="text-xs text-slate-500">
                Search, reprint, audit, or export student bills and payment slips
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportAllReceiptsJSON(receipts)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50/70 hover:bg-sky-100/80 border border-sky-200 rounded-lg transition-colors cursor-pointer"
              title="Save all invoices locally as a JSON backup file"
            >
              <FileCode className="w-3.5 h-3.5 text-sky-600" />
              Save JSON Backup
            </button>

            <label className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              Restore Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            <button
              onClick={() => exportReceiptsToCSV(receipts)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              title="Download entire history into Excel CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export to Excel (CSV)
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {importStatus && (
          <div className="bg-emerald-50/90 border-b border-emerald-300 text-emerald-700 px-5 py-2 text-xs font-medium flex items-center justify-between">
            <span>{importStatus}</span>
          </div>
        )}

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-white/50 border-b border-slate-200 text-xs">
          <div className="bg-white/90 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Today's Receipts</span>
            <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">
              {stats.todayCount} slips
            </span>
          </div>
          <div className="bg-white/90 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Collected Today</span>
            <span className="text-xl font-bold font-mono text-emerald-600 mt-0.5 block tabular-nums">
              LKR {formatCurrency(stats.todayCollected)}
            </span>
          </div>
          <div className="bg-white/90 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[11px] block">Total Outstanding Balances</span>
            <span className="text-xl font-bold font-mono text-rose-600 mt-0.5 block tabular-nums">
              LKR {formatCurrency(stats.totalOutstanding)}
            </span>
          </div>
          <div className="bg-white/90 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 text-[11px] block">All-Time Receipts</span>
            <span className="text-xl font-bold font-mono text-sky-600 mt-0.5 block">
              {stats.allCount} recorded
            </span>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, receipt #, student ID, phone, or course..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-300"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Date filter */}
            <div className="flex bg-white p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  dateFilter === 'all' ? 'bg-sky-600 text-white font-bold' : 'text-slate-500 hover:text-white'
                }`}
              >
                All Dates
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  dateFilter === 'today' ? 'bg-sky-600 text-white font-bold' : 'text-slate-500 hover:text-white'
                }`}
              >
                Today Only
              </button>
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
            >
              <option value="all">All Statuses</option>
              <option value="Paid in Full">Paid in Full</option>
              <option value="Partial / Advance">Partial / Advance</option>
            </select>
          </div>
        </div>

        {/* RECEIPTS TABLE */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <History className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm">No receipts match your search filter</p>
              <span className="text-xs text-slate-600">Try changing the keywords or date filter</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredReceipts.map(rec => (
                <div
                  key={rec.id}
                  className="bg-white/70 border border-slate-200 hover:border-slate-200 p-3 rounded-xl flex flex-wrap md:flex-nowrap items-center justify-between gap-3 transition-colors"
                >
                  {/* Left: Receipt details */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-600">
                        {rec.receiptNumber}
                      </span>
                      <span className="text-slate-500 text-xs">·</span>
                      <span className="text-xs text-slate-500">{rec.issueDate}</span>
                      <span className="text-slate-500 text-xs font-mono">{rec.issueTime}</span>
                      <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                        {rec.type}
                      </span>
                    </div>

                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-slate-900">{rec.studentName}</span>
                      <span className="text-xs font-mono text-slate-500">({rec.studentId})</span>
                      <span className="text-xs font-mono text-slate-500">{rec.studentPhone}</span>
                    </div>

                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-1.5">
                      {rec.items.map(item => (
                        <span
                          key={item.id}
                          className="bg-white border border-slate-200 text-slate-700 px-1.5 py-0.2 rounded text-[10.5px]"
                        >
                          {item.description} ({item.category})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Middle: Financials */}
                  <div className="text-right shrink-0 min-w-[150px] space-y-0.5">
                    <div className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                      Paid: LKR {formatCurrency(rec.amountPaid)}
                    </div>
                    {rec.balanceDue > 0 ? (
                      <div className="text-[11px] font-mono text-rose-600 font-semibold tabular-nums">
                        Bal: LKR {formatCurrency(rec.balanceDue)}
                        {rec.balanceDueDate && ` (Due ${rec.balanceDueDate})`}
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-emerald-600">
                        Paid in Full ✅
                      </div>
                    )}
                    <div className="text-[10.5px] text-slate-500">
                      Method: <strong className="text-slate-700">{rec.paymentMethod}</strong>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        onSelectReceipt(rec);
                        onClose();
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-sky-600 rounded-lg transition-colors cursor-pointer"
                      title="Load into Receipt Editor"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => exportReceiptAsJSON(rec)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-amber-400 rounded-lg transition-colors cursor-pointer"
                      title="Download receipt JSON backup locally"
                    >
                      <FileCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onPrintA5(rec)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg transition-colors cursor-pointer"
                      title="Print A5 Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete receipt record ${rec.receiptNumber}?`)) {
                          onDeleteReceipt(rec.id);
                        }
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 bg-white/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredReceipts.length} of {receipts.length} records</span>
          <span>Smartlabs (Pvt) Ltd Official Registry</span>
        </div>
      </div>
    </div>
  );
};
