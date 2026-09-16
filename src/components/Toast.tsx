import { FaCircleCheck } from 'react-icons/fa6';

interface ToastProps {
  message: string | null;
}

function Toast({ message }: ToastProps) {
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
    </div>
  );
}

export default Toast;
