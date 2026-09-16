import { useEffect, useState } from 'react';
import { FaMagnifyingGlass, FaRightFromBracket, FaCircleExclamation, FaXmark, FaUserGear } from 'react-icons/fa6';
import { api, type ApiStaffUser } from '../api';
import { useAuth } from '../auth';

interface LoginAsModalProps {
  onClose: () => void;
}

/**
 * Admin-only "Login as": lists every created staff user (any role) so the
 * admin can switch the session to that user and see the app exactly as they
 * do. The real admin account is preserved and restored via "Switch back".
 */
function LoginAsModal({ onClose }: LoginAsModalProps) {
  const { user: currentUser, loginAs } = useAuth();
  const [staff, setStaff] = useState<ApiStaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [switching, setSwitching] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listStaff()
      .then((res) => {
        if (!cancelled) setStaff(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message || 'Failed to load users');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = staff.filter((s) => {
    if (currentUser && s.id === currentUser.id) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.full_name ?? '').toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q) ||
      (s.user_type ?? '').toLowerCase().includes(q)
    );
  });

  const handlePick = async (s: ApiStaffUser) => {
    if (switching !== null) return;
    setSwitching(s.id);
    setError(null);
    try {
      await loginAs(s.id);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Could not switch user');
      setSwitching(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && switching === null) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FaUserGear className="text-slate-400 text-sm" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Login as</h3>
          </div>
          <button
            onClick={onClose}
            disabled={switching !== null}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <FaXmark />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email or role…"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="py-10 text-center text-xs text-slate-400">Loading users…</div>
          ) : error ? (
            <div className="m-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-xs">
              <FaCircleExclamation className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-xs text-slate-500 font-medium">No users found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Create users under Settings → My Staff.</p>
            </div>
          ) : (
            filtered.map((s) => {
              const initials = `${s.first_name?.[0] ?? ''}${s.last_name?.[0] ?? ''}`.toUpperCase() || 'U';
              const isSwitching = switching === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => void handlePick(s)}
                  disabled={switching !== null}
                  className="w-full text-left px-5 py-3 flex items-center gap-3 border-b border-slate-50 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <div className="w-9 h-9 rounded-full bg-pink-600 text-white text-xs font-semibold flex items-center justify-center overflow-hidden flex-shrink-0">
                    {s.avatar_data ? (
                      <img src={s.avatar_data} alt={s.full_name ?? 'User'} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-800 truncate">{s.full_name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{s.email}</div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      s.user_type === 'Admin'
                        ? 'bg-purple-100 text-purple-700'
                        : s.user_type === 'Dealer'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.user_type}
                  </span>
                  <FaRightFromBracket className="text-[10px] text-slate-400 flex-shrink-0" />
                  {isSwitching && <span className="text-[10px] text-slate-400">Switching…</span>}
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-[11px] text-slate-400">
            You will view the app exactly as that user. Switch back anytime from your profile menu.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginAsModal;