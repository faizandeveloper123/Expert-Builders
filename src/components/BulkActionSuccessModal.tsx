import { FaXmark } from 'react-icons/fa6';

interface BulkActionSuccessModalProps {
  open: boolean;
  message: string;
  onDismiss: () => void;
  onCheckProgress: () => void;
  onClose: () => void;
}

const outlineBtnCls =
  'rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap';
const primaryBtnCls =
  'rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap';

function BulkActionSuccessModal({ open, message, onDismiss, onCheckProgress, onClose }: BulkActionSuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 evee-fade-in">
      <div className="animate-pop w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">Success</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <FaXmark className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">{message}</p>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onDismiss} className={outlineBtnCls}>
            Dismiss
          </button>
          <button onClick={onCheckProgress} className={primaryBtnCls}>
            Check progress
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkActionSuccessModal;
