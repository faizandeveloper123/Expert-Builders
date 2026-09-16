import { useState } from 'react';
import { FaChevronDown, FaCircleInfo, FaXmark } from 'react-icons/fa6';
import type { Contact } from '../types';
import Avatar from './Avatar';

export type ReviewMode = 'all' | 'scheduled' | 'drip';

interface BulkReviewRequestModalProps {
  open: boolean;
  selectedCount: number;
  selectedContacts?: Contact[];
  onClose: () => void;
  onSubmit: (data: { actionName: string; reviewOption: string; mode: ReviewMode }) => void;
}

const REVIEW_OPTIONS = [
  { value: 'sms', label: 'SMS review request' },
  { value: 'email', label: 'Email review request' },
  { value: 'whatsapp', label: 'WhatsApp review request' },
];

const MODE_OPTIONS: { id: ReviewMode; label: string }[] = [
  { id: 'all', label: 'Send all at once' },
  { id: 'scheduled', label: 'Send at scheduled time' },
  { id: 'drip', label: 'Send in drip mode' },
];

const inputCls =
  'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all';
const labelCls = 'block text-sm font-medium text-slate-800 mb-1.5';
const outlineBtnCls =
  'rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap';
const primaryBtnCls =
  'rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors shadow-sm whitespace-nowrap';

function BulkReviewRequestModal({
  open,
  selectedCount,
  selectedContacts = [],
  onClose,
  onSubmit,
}: BulkReviewRequestModalProps) {
  const [actionName, setActionName] = useState('');
  const [reviewOption, setReviewOption] = useState('');
  const [mode, setMode] = useState<ReviewMode>('all');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ actionName: actionName.trim(), reviewOption, mode });
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 evee-fade-in">
      <div className="animate-pop w-full max-w-xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="flex items-start justify-between p-6 pb-2 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Bulk review request</h2>
            <p className="text-sm text-slate-500 mt-0.5">Review requests for all selected</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <FaXmark className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-5 custom-scrollbar">
            <div>
              <label className={labelCls}>Send review request to following contacts</label>
              <div className="flex flex-wrap items-center gap-2">
                {selectedContacts.map((c) => (
                  <Avatar key={c.id} initials={c.initials} color={c.avatarColor} image={c.image} size="h-8 w-8" />
                ))}
                {selectedContacts.length === 0 && (
                  <span className="text-sm text-slate-400">{selectedCount} contact{selectedCount === 1 ? '' : 's'} selected</span>
                )}
              </div>
            </div>

            <div>
              <label className={labelCls}>
                Action name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                placeholder="e.g., Customer Satisfaction Survey"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>
                Review request options <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={reviewOption}
                  onChange={(e) => setReviewOption(e.target.value)}
                  className={`${inputCls} appearance-none pr-10 border-blue-300 ${reviewOption ? '' : 'text-slate-400'}`}
                >
                  <option value="" disabled hidden>
                    Select review request type
                  </option>
                  {REVIEW_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <FaChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className={`${labelCls} mb-2`}>Mode</label>
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-700">
                {MODE_OPTIONS.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === opt.id}
                      onChange={() => setMode(opt.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-blue-50/80 p-3.5 text-blue-600 border border-blue-100/50">
              <FaCircleInfo className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed font-medium">
                Bulk actions are performed over a period of time. You can track the progress on the bulk actions page.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-t border-slate-100 flex-shrink-0">
            <button type="button" onClick={onClose} className={outlineBtnCls}>
              Cancel
            </button>
            <button type="submit" className={primaryBtnCls}>
              Send review request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BulkReviewRequestModal;
