import React from 'react';
import { InstituteInfo, ReceiptData } from '../types/receipt';
import { ReceiptA5 } from './ReceiptA5';

interface DualA4PrintViewProps {
  receipt: ReceiptData;
  institute: InstituteInfo;
}

export const DualA4PrintView: React.FC<DualA4PrintViewProps> = ({ receipt, institute }) => {
  return (
    <div
      className="dual-a4-container bg-white text-slate-900 mx-auto"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '5mm',
        boxSizing: 'border-box'
      }}
    >
      {/* TOP RECEIPT: STUDENT COPY (Scales cleanly to fit top half of A4) */}
      <div className="flex flex-col items-center">
        <div className="w-[148mm] transform scale-[0.94] origin-top">
          <ReceiptA5
            receipt={receipt}
            institute={institute}
            copyLabel="STUDENT COPY"
            isPrintMode={true}
          />
        </div>
      </div>

      {/* DASHED CUT LINE FOR PAPER SLICER / SCISSORS */}
      <div className="w-full my-2 flex items-center justify-between text-[9px] text-slate-400 font-mono select-none px-4">
        <span className="flex-1 border-b-2 border-dashed border-slate-300"></span>
        <span className="px-3 flex items-center gap-1.5 uppercase font-semibold text-slate-500 tracking-wider">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
          CUT HERE / SMARTLABS ACCOUNTS & OFFICE FILING COPY
        </span>
        <span className="flex-1 border-b-2 border-dashed border-slate-300"></span>
      </div>

      {/* BOTTOM RECEIPT: INSTITUTE / OFFICE COPY */}
      <div className="flex flex-col items-center">
        <div className="w-[148mm] transform scale-[0.94] origin-top">
          <ReceiptA5
            receipt={receipt}
            institute={institute}
            copyLabel="INSTITUTE / OFFICE COPY"
            isPrintMode={true}
          />
        </div>
      </div>
    </div>
  );
};
