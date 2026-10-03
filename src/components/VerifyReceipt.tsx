import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { ReceiptData } from '../types/receipt';
import { findReceiptByNumber } from '../utils/cloudStore';
import { formatCurrency } from '../utils/numberToWords';

// Opened when a student scans the QR code on a receipt (?verify=<receipt number>)
export const VerifyReceipt: React.FC<{ receiptNumber: string }> = ({ receiptNumber }) => {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error'; message: string } | { status: 'done'; receipt: ReceiptData | null }>({
    status: 'loading'
  });

  useEffect(() => {
    findReceiptByNumber(receiptNumber)
      .then(receipt => setState({ status: 'done', receipt }))
      .catch(() => setState({ status: 'error', message: 'Could not reach the verification database. Please try again.' }));
  }, [receiptNumber]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-900">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h1 className="text-sm font-bold text-slate-500 uppercase tracking-wider">SmartLabs Receipt Verification</h1>

        {state.status === 'loading' && <p className="text-sm text-slate-500">Checking receipt {receiptNumber}...</p>}

        {state.status === 'error' && <p className="text-sm text-rose-600">{state.message}</p>}

        {state.status === 'done' && !state.receipt && (
          <div className="space-y-2">
            <XCircle className="w-10 h-10 text-rose-600" />
            <p className="text-lg font-bold text-rose-600">Receipt not found</p>
            <p className="text-xs text-slate-500 font-mono">{receiptNumber}</p>
            <p className="text-xs text-slate-500">This receipt is not in the SmartLabs records. Please contact the office.</p>
          </div>
        )}

        {state.status === 'done' && state.receipt && (
          <div className="space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            <p className="text-lg font-bold text-emerald-600">Valid receipt</p>
            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Receipt No</dt><dd className="font-mono font-semibold">{state.receipt.receiptNumber}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Date</dt><dd>{state.receipt.issueDate}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Student</dt><dd className="font-semibold text-right">{state.receipt.studentName}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Student ID</dt><dd className="font-mono">{state.receipt.studentId}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Amount Paid</dt><dd className="font-mono">LKR {formatCurrency(state.receipt.amountPaid)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Balance Due</dt><dd className="font-mono">LKR {formatCurrency(state.receipt.balanceDue)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-slate-500">Status</dt><dd>{state.receipt.status}</dd></div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};
