import { toPng } from 'html-to-image';
import { ReceiptData } from '../types/receipt';
import { saveReceipt, saveReceipts, getReceipts } from './storage';

/**
 * Download an HTML element as high-res PNG image locally to the user's computer
 */
export async function downloadReceiptAsImage(
  element: HTMLElement,
  filename: string
): Promise<boolean> {
  try {
    // html-to-image renders through the browser, so modern colors (oklch from Tailwind v4) work
    const dataUrl = await toPng(element, {
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      cacheBust: true,
      skipFonts: true
    });
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Failed to export receipt image', error);
    return false;
  }
}

/**
 * Save an individual receipt locally as a JSON backup file
 */
export function exportReceiptAsJSON(receipt: ReceiptData): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(receipt, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  const cleanName = (receipt.studentName || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('download', `${receipt.receiptNumber}_${cleanName}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Save all receipts locally as a complete JSON backup file
 */
export function exportAllReceiptsJSON(receipts: ReceiptData[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(receipts, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `SmartLabs_Complete_Ledger_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Import receipts from a locally selected JSON file
 */
export function importReceiptsFromJSON(file: File): Promise<{ count: number; receipts: ReceiptData[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const incoming: ReceiptData[] = Array.isArray(parsed) ? parsed : [parsed];
        const existing = getReceipts();

        // Merge incoming into existing by ID or receiptNumber
        const map = new Map<string, ReceiptData>();
        existing.forEach(r => map.set(r.id, r));
        incoming.forEach(r => map.set(r.id || 'rec-' + Date.now() + Math.random(), r));

        const merged = Array.from(map.values());
        saveReceipts(merged);
        resolve({ count: incoming.length, receipts: merged });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = err => reject(err);
    reader.readAsText(file);
  });
}
