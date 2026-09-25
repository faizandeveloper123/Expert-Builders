import { FaCircleCheck } from 'react-icons/fa6';

interface ToastProps {
  message: string | null;
  actionLabel?: string;
  onAction?: () => void;
}

function Toast({ message, actionLabel, onAction }: ToastProps) {
  const visible = message !== null;
  return (
    <div
      className={`fixed bottom-5 right-5 bg-slate-800 text-white px-4 py-2.5 rounded-lg text-xs shadow-lg flex items-center space-x-2 z-[60] transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
      role="status"
      aria-live="polite"
    >
      <FaCircleCheck className="text-emerald-400" />
      <span>{message ?? ''}</span>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="ml-2 rounded-md border border-slate-500 px-2.5 py-1 font-semibold text-emerald-300 hover:bg-slate-700 hover:border-emerald-400 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default Toast;