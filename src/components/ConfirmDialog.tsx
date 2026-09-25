import { FaTriangleExclamation, FaXmark } from 'react-icons/fa6';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const outlineBtnCls =
  'rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap';
const dangerBtnCls =
  'rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap';

function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 evee-fade-in">
      <div className="animate-pop w-full max-w-md max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-lg">
            <FaTriangleExclamation />
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <FaXmark className="h-5 w-5" />
          </button>
        </div>

        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed mt-2 mb-6">{message}</p>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className={outlineBtnCls}>
            Cancel
          </button>
          <button onClick={onConfirm} className={dangerBtnCls}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;