import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { InstituteInfo } from '../types/receipt';

interface SessionSetupModalProps {
  institute: InstituteInfo;
  onContinue: (updated: InstituteInfo) => void;
}

// Shown every time the app is opened. The admin name is required; it is printed on receipts.
export const SessionSetupModal: React.FC<SessionSetupModalProps> = ({ institute, onContinue }) => {
  const [adminName, setAdminName] = useState(institute.adminName || '');
  const [currentUserName, setCurrentUserName] = useState(institute.currentUserName || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      setError('Please enter the authorized admin name to continue.');
      return;
    }
    onContinue({
      ...institute,
      adminName: adminName.trim(),
      currentUserName: currentUserName.trim() || adminName.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 text-slate-900"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Welcome to SmartLabs Billing</h2>
            <p className="text-xs text-slate-500">Enter your name to start. It is printed on receipts.</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">Authorized Admin Name *</label>
          <input
            autoFocus
            type="text"
            value={adminName}
            onChange={e => {
              setAdminName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Admin name"
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-300"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">Current User (optional)</label>
          <input
            type="text"
            value={currentUserName}
            onChange={e => setCurrentUserName(e.target.value)}
            placeholder="Defaults to the admin name"
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-300"
          />
        </div>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <button
          type="submit"
          className="w-full px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-lg shadow-sm cursor-pointer"
        >
          Continue
        </button>
      </form>
    </div>
  );
};
