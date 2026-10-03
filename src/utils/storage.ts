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

  // Pre-seed with realistic SmartLabs receipts
  const seeded = getSampleReceipts();
  saveReceipts(seeded);
  return seeded;
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

function getSampleReceipts(): ReceiptData[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'rec-001',
      receiptNumber: 'SL-REC-2026-1039',
      type: 'Receipt',
      issueDate: today,
      issueTime: '10:15',
      studentName: 'Kasun Dananjaya Perera',
      studentId: 'SL-STD-2026-089',
      studentPhone: '077 123 4567',
      studentEmail: 'kasun.p@gmail.com',
      batch: 'Batch 2026-A (Weekend)',
      cashierName: 'Counter 01 / SmartLabs Reception',
      items: [
        {
          id: 'item-1',
          category: 'Physical Class',
          description: 'Physical Class - In-Person Classroom Lectures (Robotics Level 1)',
          code: 'ROB-101',
          quantity: 1,
          unitPrice: 12000,
          amount: 12000
        },
        {
          id: 'item-2',
          category: 'Admission Fee',
          description: 'Annual Institute Registration & SmartLabs Student ID Card',
          code: 'REG-2026',
          quantity: 1,
          unitPrice: 2500,
          amount: 2500
        }
      ],
      subtotal: 14500,
      discountType: 'fixed',
      discountValue: 1000,
      discountAmount: 1000,
      total: 13500,
      amountPaid: 13500,
      balanceDue: 0,
      paymentMethod: 'Cash',
      notes: 'Full payment completed. Student issued Student ID Card.',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      status: 'Paid in Full'
    },
    {
      id: 'rec-002',
      receiptNumber: 'SL-REC-2026-1040',
      type: 'Receipt',
      issueDate: today,
      issueTime: '11:45',
      studentName: 'Amaya Nimnadi Fernando',
      studentId: 'SL-STD-2026-092',
      studentPhone: '071 987 6543',
      studentEmail: 'amaya.fernando@outlook.com',
      batch: 'Batch 2026-B (Weekday Evening)',
      cashierName: 'Counter 01 / SmartLabs Reception',
      items: [
        {
          id: 'item-3',
          category: 'Recorded Sessions',
          description: 'Recorded Sessions Full Module Access (Python for AI & Data Science)',
          code: 'PY-REC',
          quantity: 1,
          unitPrice: 6500,
          amount: 6500
        }
      ],
      subtotal: 6500,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      total: 6500,
      amountPaid: 6500,
      balanceDue: 0,
      paymentMethod: 'Bank Transfer',
      paymentReference: 'Commercial Bank Ref: CB9928371',
      notes: 'Portal access credentials sent to email.',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'Paid in Full'
    },
    {
      id: 'rec-003',
      receiptNumber: 'SL-REC-2026-1041',
      type: 'Receipt',
      issueDate: today,
      issueTime: '14:20',
      studentName: 'Sahan Sithum Ranasinghe',
      studentId: 'SL-STD-2026-095',
      studentPhone: '078 456 7890',
      studentEmail: 'sahan.r@gmail.com',
      batch: 'Batch 2026-C (Sunday)',
      cashierName: 'Counter 01 / SmartLabs Reception',
      items: [
        {
          id: 'item-4',
          category: 'Individual Session',
          description: 'Individual 1-on-1 Practical & Mentoring Session (Arduino & IoT Architecture)',
          code: 'IOT-1ON1',
          quantity: 2,
          unitPrice: 4500,
          amount: 9000
        }
      ],
      subtotal: 9000,
      discountType: 'fixed',
      discountValue: 0,
      discountAmount: 0,
      total: 9000,
      amountPaid: 5000,
      balanceDue: 4000,
      balanceDueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      paymentMethod: 'Online / QR',
      paymentReference: 'LANKAQR-TXN-482910',
      notes: 'Advance deposit paid. Balance due on next Sunday session.',
      createdAt: new Date().toISOString(),
      status: 'Partial / Advance'
    }
  ];
}
