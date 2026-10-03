import React, { useState } from 'react';
import { DEFAULT_INSTITUTE_INFO, InstituteInfo } from '../types/receipt';
import { SmartLabsOfficialLogo } from './SmartLabsOfficialLogo';
import { Building2, Image as ImageIcon, Plus, RotateCcw, Save, Trash2, Upload, X } from 'lucide-react';

interface InstituteSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  institute: InstituteInfo;
  onSave: (updated: InstituteInfo) => void;
}

export const InstituteSettingsModal: React.FC<InstituteSettingsModalProps> = ({
  isOpen,
  onClose,
  institute,
  onSave
}) => {
  const [formData, setFormData] = useState<InstituteInfo>(institute);
  const [newTerm, setNewTerm] = useState('');

  if (!isOpen) return null;

  const handleChange = <K extends keyof InstituteInfo>(key: K, val: InstituteInfo[K]) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          handleChange('logoUrl', ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCustomLogo = () => {
    setFormData(prev => {
      const copy = { ...prev };
      delete copy.logoUrl;
      return copy;
    });
  };

  const handleAddTerm = () => {
    if (!newTerm.trim()) return;
    setFormData(prev => ({ ...prev, terms: [...prev.terms, newTerm.trim()] }));
    setNewTerm('');
  };

  const handleRemoveTerm = (index: number) => {
    setFormData(prev => ({ ...prev, terms: prev.terms.filter((_, idx) => idx !== index) }));
  };

  const handleResetToDefaults = () => {
    setFormData(DEFAULT_INSTITUTE_INFO);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 max-h-[90vh]">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-800/40">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Smartlabs (Pvt) Ltd Official Info</h2>
              <p className="text-xs text-slate-400">
                Printed on all student receipts, invoices, and verification codes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Logo Section */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                Receipt Brand Logo
              </span>
              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveCustomLogo}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Use Official Vector Logo
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
              <SmartLabsOfficialLogo
                size="md"
                customLogoUrl={formData.logoUrl}
                showSubtitle={false}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-medium cursor-pointer border border-slate-700">
                <Upload className="w-3.5 h-3.5" />
                Upload New Logo Image (PNG / JPEG)
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-slate-500">
                Default: Official SmartLabs SVG Logo
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-300 block mb-1">Company / Institute Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-300 block mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Primary Hotline</label>
              <input
                type="text"
                value={formData.phonePrimary}
                onChange={e => handleChange('phonePrimary', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Additional Contact Lines</label>
              <input
                type="text"
                value={formData.phoneSecondary}
                onChange={e => handleChange('phoneSecondary', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Official Website</label>
              <input
                type="text"
                value={formData.website}
                onChange={e => handleChange('website', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Counter / Cashier Desk</label>
              <input
                type="text"
                value={formData.cashierName}
                onChange={e => handleChange('cashierName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Company Reg (PV) No</label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={e => handleChange('registrationNumber', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Terms & Conditions list */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="font-semibold text-slate-300 block">
              Printed Terms & Conditions (Policy rules on receipt bottom)
            </label>
            <div className="space-y-1.5">
              {formData.terms.map((term, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 font-mono text-[10px] w-4">{idx + 1}.</span>
                  <span className="flex-1 text-slate-300 text-xs">{term}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTerm(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add custom policy term..."
                value={newTerm}
                onChange={e => setNewTerm(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTerm();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTerm}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Official Smartlabs Info
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
