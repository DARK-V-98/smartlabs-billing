import { DEFAULT_INSTITUTE_INFO, InstituteInfo, ReceiptData } from '../types/receipt';

const STORAGE_KEY_RECEIPTS = 'smartlabs_receipts_v2';
const STORAGE_KEY_SETTINGS = 'smartlabs_settings_v2';
const STORAGE_KEY_COUNTER = 'smartlabs_receipt_counter_v2';

export function getSavedInstituteInfo(): InstituteInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return { ...DEFAULT_INSTITUTE_INFO, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load institute settings', e);
  }
  return DEFAULT_INSTITUTE_INFO;
}

export function saveInstituteInfo(info: InstituteInfo): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(info));
  } catch (e) {
    console.error('Failed to save institute settings', e);
  }
}

export function getReceiptCounter(): number {
  return parseInt(localStorage.getItem(STORAGE_KEY_COUNTER) || '1041', 10);
}

export function setReceiptCounter(value: number): void {
  localStorage.setItem(STORAGE_KEY_COUNTER, value.toString());
}

export function getNextReceiptNumber(): string {
  try {
    const current = parseInt(localStorage.getItem(STORAGE_KEY_COUNTER) || '1041', 10);
    const next = current + 1;
    localStorage.setItem(STORAGE_KEY_COUNTER, next.toString());
    const year = new Date().getFullYear();
    return `SL-REC-${year}-${next.toString().padStart(4, '0')}`;
  } catch (e) {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `SL-REC-${new Date().getFullYear()}-${random}`;
  }
}

export function getReceipts(): ReceiptData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECEIPTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse receipts from storage', e);
  }
  return [];
}

export function saveReceipt(receipt: ReceiptData): void {
  const current = getReceipts();
  const index = current.findIndex(r => r.id === receipt.id);
  let updated: ReceiptData[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = receipt;
  } else {
    updated = [receipt, ...current];
  }
  saveReceipts(updated);
}

export function deleteReceipt(id: string): ReceiptData[] {
  const current = getReceipts();
  const filtered = current.filter(r => r.id !== id);
  saveReceipts(filtered);
  return filtered;
}

export function saveReceipts(receipts: ReceiptData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RECEIPTS, JSON.stringify(receipts));
  } catch (e) {
    console.error('Failed to save receipts', e);
  }
}

export function exportReceiptsToCSV(receipts: ReceiptData[]): void {
  if (!receipts.length) return;

  const headers = [
    'Receipt No',
    'Date',
    'Time',
    'Student Name',
    'Student ID',
    'Phone',
    'Batch',
    'Type',
    'Courses / Items',
    'Subtotal (LKR)',
    'Discount (LKR)',
    'Net Total (LKR)',
    'Amount Paid (LKR)',
    'Balance Due (LKR)',
    'Payment Method',
    'Reference',
    'Status'
  ];

  const rows = receipts.map(r => [
    `"${r.receiptNumber}"`,
    `"${r.issueDate}"`,
    `"${r.issueTime}"`,
    `"${r.studentName.replace(/"/g, '""')}"`,
    `"${r.studentId}"`,
    `"${r.studentPhone}"`,
    `"${r.batch}"`,
    `"${r.type}"`,
    `"${r.items.map(i => `${i.description} [${i.category}]`).join('; ').replace(/"/g, '""')}"`,
    r.subtotal,
    r.discountAmount,
    r.total,
    r.amountPaid,
    r.balanceDue,
    `"${r.paymentMethod}"`,
    `"${r.paymentReference || ''}"`,
    `"${r.status}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SmartLabs_Receipt_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
