import React from 'react';
import { InstituteInfo, ReceiptData } from '../types/receipt';
import { formatCurrency, numberToWords } from '../utils/numberToWords';
import { ReceiptQRCode } from './ReceiptQRCode';
import { SmartLabsOfficialLogo } from './SmartLabsOfficialLogo';

interface ReceiptA5Props {
  receipt: ReceiptData;
  institute: InstituteInfo;
  copyLabel?: string;
  isPrintMode?: boolean;
}

export const ReceiptA5: React.FC<ReceiptA5Props> = ({
  receipt,
  institute,
  copyLabel = 'STUDENT COPY',
  isPrintMode = false
}) => {
  const qrVerificationPayload = JSON.stringify({
    ref: receipt.receiptNumber,
    std: receipt.studentName,
    id: receipt.studentId,
    paid: receipt.amountPaid,
    bal: receipt.balanceDue,
    dt: receipt.issueDate,
    org: 'Smartlabs (Pvt) Ltd',
    url: 'https://www.smartlabs.lk'
  });

  return (
    <div
      id={!isPrintMode ? 'receipt-a5-node' : undefined}
      className={`receipt-a5-sheet bg-white text-slate-900 mx-auto relative flex flex-col justify-between overflow-hidden ${
        isPrintMode
          ? 'w-[148mm] min-h-[209mm] max-h-[209mm] p-[7mm]'
          : 'w-[148mm] min-h-[210mm] p-[8mm] shadow-2xl rounded-sm border border-slate-200'
      }`}
      style={{
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* Subtle SmartLabs Geometric Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.025] select-none">
        <svg viewBox="0 0 100 100" className="w-[110mm] h-[110mm]">
          <path
            d="M45 15H55M50 15V35M35 70L46 40H54L65 70C67 75 63 80 58 80H42C37 80 33 75 35 70Z"
            stroke="#0f172a"
            strokeWidth="3"
            fill="none"
          />
          <circle cx="50" cy="62" r="6" fill="#0f172a" />
        </svg>
      </div>

      {/* TOP HEADER SECTION */}
      <div>
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-sky-500 to-amber-500 rounded-full mb-2.5" />

        {/* Header grid: Brand & Contact Info */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-2.5 gap-3">
          <div className="flex-1">
            <SmartLabsOfficialLogo
              size="md"
              customLogoUrl={institute.logoUrl}
              showSubtitle={true}
            />
            <p className="text-[10px] text-slate-600 mt-1 leading-snug">
              {institute.address}
            </p>
            <div className="text-[10px] text-slate-700 font-medium flex flex-wrap gap-x-2.5 mt-0.5">
              <span>
                <strong className="text-slate-900 font-semibold">Hotline:</strong> {institute.phonePrimary}
              </span>
              <span className="text-slate-400">|</span>
              <span>{institute.phoneSecondary}</span>
            </div>
            <div className="text-[10px] text-slate-600 flex flex-wrap gap-x-2.5 mt-0.5">
              <span>
                <strong className="text-slate-800">Email:</strong> {institute.email}
              </span>
              <span className="text-slate-400">·</span>
              <span>
                <strong className="text-slate-800">Web:</strong> {institute.website}
              </span>
            </div>
          </div>

          {/* Right badge: Document Type, Receipt #, Date & Copy */}
          <div className="text-right shrink-0 flex flex-col items-end">
            <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1 rounded text-[11px] font-bold tracking-wide uppercase">
              <span>{receipt.type === 'Invoice' ? 'OFFICIAL INVOICE' : 'PAYMENT RECEIPT'}</span>
            </div>

            <div className="mt-1.5 text-right">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">Receipt No</div>
              <div className="text-xs font-mono font-bold text-blue-700 tracking-tight">
                {receipt.receiptNumber}
              </div>
            </div>

            <div className="mt-0.5 text-right flex items-center gap-2 text-[10px] text-slate-600">
              <span>
                <strong>Date:</strong> {receipt.issueDate}
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-mono">{receipt.issueTime}</span>
            </div>

            <span className="mt-1 text-[8.5px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-slate-300 text-slate-600 bg-slate-50">
              {copyLabel}
            </span>
          </div>
        </div>

        {/* STUDENT & ENROLLMENT PARTICULARS */}
        <div className="my-2.5 p-2.5 bg-slate-50 border border-slate-200/90 rounded text-[11px]">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-7">
              <span className="text-[9.5px] font-medium text-slate-500 uppercase tracking-wider block">
                Student Name
              </span>
              <span className="font-bold text-slate-900 text-[12px] block truncate">
                {receipt.studentName || '—'}
              </span>
            </div>
            <div className="col-span-5">
              <span className="text-[9.5px] font-medium text-slate-500 uppercase tracking-wider block">
                Student Reg / ID
              </span>
              <span className="font-mono font-semibold text-slate-800 block truncate">
                {receipt.studentId || '—'}
              </span>
            </div>

            <div className="col-span-4">
              <span className="text-[9.5px] font-medium text-slate-500 uppercase tracking-wider block">
                Contact / WhatsApp
              </span>
              <span className="font-mono text-slate-800 block">
                {receipt.studentPhone || '—'}
              </span>
            </div>
            <div className="col-span-4">
              <span className="text-[9.5px] font-medium text-slate-500 uppercase tracking-wider block">
                Batch / Intake
              </span>
              <span className="text-slate-800 font-medium block truncate">
                {receipt.batch || 'General'}
              </span>
            </div>
            <div className="col-span-4">
              <span className="text-[9.5px] font-medium text-slate-500 uppercase tracking-wider block">
                Payment Method
              </span>
              <span className="text-slate-900 font-semibold block truncate">
                {receipt.paymentMethod}
                {receipt.paymentReference ? ` (${receipt.paymentReference})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* LINE ITEMS / COURSE FEE BREAKDOWN TABLE */}
        <div className="border border-slate-200 rounded overflow-hidden">
          <table className="w-full text-left border-collapse text-[10.5px]">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase text-[9px] tracking-wider">
                <th className="py-1.5 px-2.5 w-8 text-center">#</th>
                <th className="py-1.5 px-2">Course / Payment Description</th>
                <th className="py-1.5 px-2 w-28">Session Type</th>
                <th className="py-1.5 px-2 w-12 text-center">Qty</th>
                <th className="py-1.5 px-2 w-20 text-right">Fee (LKR)</th>
                <th className="py-1.5 px-2.5 w-22 text-right">Total (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipt.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                    No course or session items added
                  </td>
                </tr>
              ) : (
                receipt.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-1.5 px-2.5 text-center text-slate-500 font-mono text-[9.5px]">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {item.description}
                      </div>
                      {item.code && (
                        <div className="text-[9px] font-mono text-slate-500">
                          Code: {item.code}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 px-2">
                      <span className="inline-block text-[9.5px] font-medium text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200/60 leading-none">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-slate-700 tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FINANCIAL SUMMARY & AMOUNT IN WORDS */}
        <div className="mt-2.5 grid grid-cols-12 gap-3 items-start">
          {/* Left col: Amount in words & status & notes */}
          <div className="col-span-7 space-y-2">
            <div className="p-2 rounded bg-slate-50 border border-slate-200/80">
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">
                Amount in Words
              </span>
              <p className="text-[10px] font-bold text-slate-900 leading-snug italic mt-0.5">
                {numberToWords(receipt.amountPaid)}
              </p>
            </div>

            {receipt.notes && (
              <div className="text-[9.5px] text-slate-600 bg-amber-50/60 border border-amber-200/60 p-1.5 rounded">
                <strong className="text-amber-900 font-semibold">Note:</strong> {receipt.notes}
              </div>
            )}

            {/* Payment Status Pill */}
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] text-slate-500 font-medium">Status:</span>
              {receipt.balanceDue <= 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  PAID IN FULL
                </span>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  PARTIAL PAYMENT
                  {receipt.balanceDueDate && (
                    <span className="text-[9px] font-normal text-amber-900">
                      (Due: {receipt.balanceDueDate})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right col: Numerical Totals */}
          <div className="col-span-5 bg-slate-50 p-2.5 rounded border border-slate-200/90 text-[10.5px] space-y-1">
            <div className="flex justify-between items-center text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono tabular-nums">LKR {formatCurrency(receipt.subtotal)}</span>
            </div>

            {receipt.discountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-700 font-medium">
                <span>Discount:</span>
                <span className="font-mono tabular-nums">- LKR {formatCurrency(receipt.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-900 font-bold border-t border-slate-200 pt-1">
              <span>Net Total:</span>
              <span className="font-mono tabular-nums">LKR {formatCurrency(receipt.total)}</span>
            </div>

            <div className="flex justify-between items-center text-sky-900 font-bold bg-sky-100/70 -mx-1.5 px-1.5 py-0.5 rounded">
              <span>Amount Paid:</span>
              <span className="font-mono text-[11.5px] tabular-nums">
                LKR {formatCurrency(receipt.amountPaid)}
              </span>
            </div>

            <div
              className={`flex justify-between items-center font-bold ${
                receipt.balanceDue > 0
                  ? 'text-rose-700 bg-rose-50 -mx-1.5 px-1.5 py-0.5 rounded'
                  : 'text-slate-500'
              }`}
            >
              <span>Balance Due:</span>
              <span className="font-mono tabular-nums">
                LKR {formatCurrency(receipt.balanceDue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER SECTION: QR CODE, TERMS & SIGNATURES */}
      <div className="pt-2 border-t border-slate-200">
        <div className="grid grid-cols-12 gap-3 items-end">
          {/* Verification QR Code */}
          <div className="col-span-3 flex flex-col items-center justify-center p-1 bg-white border border-slate-200 rounded">
            <ReceiptQRCode value={qrVerificationPayload} size={58} />
            <span className="text-[7.5px] text-slate-500 font-mono tracking-tight mt-0.5 text-center">
              Scan to Verify Official Slip
            </span>
          </div>

          {/* Terms & Conditions */}
          <div className="col-span-5 text-[8px] text-slate-500 leading-tight space-y-0.5">
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[8.5px]">
              Terms & Conditions:
            </p>
            <ol className="list-decimal pl-3 space-y-0.5">
              <li>Fees once paid are non-refundable and non-transferable.</li>
              <li>Valid for official course entry, lab practicals & LMS access.</li>
              <li>Please keep this official receipt for student records.</li>
            </ol>
          </div>

          {/* Official Signatures & Seal */}
          <div className="col-span-4 flex flex-col justify-end text-center">
            <div className="relative mb-1">
              {/* Digital Institute Seal / Stamp representation */}
              <div className="inline-block border-2 border-dashed border-sky-800/40 rounded-full px-2 py-0.5 text-[8px] font-bold text-sky-800 rotate-[-4deg]">
                SMARTLABS CERTIFIED
              </div>
            </div>

            <div className="border-t border-slate-400 pt-1 text-[9px] font-semibold text-slate-800">
              Authorized Cashier / Officer
            </div>
            <div className="text-[8px] text-slate-500">
              Smartlabs (Pvt) Ltd · Nugegoda
            </div>
          </div>
        </div>

        {/* Bottom micro-footer */}
        <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[7.5px] text-slate-400">
          <span>Smartlabs Official Billing Engine · System Generated · www.smartlabs.lk</span>
          <span className="font-mono">Ref: {receipt.receiptNumber} · Page 1 of 1</span>
        </div>
      </div>
    </div>
  );
};
