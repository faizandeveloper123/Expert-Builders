import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaGear, FaRightFromBracket, FaRightToBracket, FaUserGear } from 'react-icons/fa6';
import type { ApiStaffUser } from '../api';
import { useAuth } from '../auth';
import ProfileEditModal from './ProfileEditModal';
import LoginAsModal from './LoginAsModal';

interface UserMenuProps {
  user: ApiStaffUser;
  onLogout?: () => void;
  className?: string;
}

/**
 * The logged-in user's avatar + menu (Account settings / Sign out). The
 * dropdown is rendered through a React portal directly on <body> and
 * positioned with fixed coordinates, so it is never clipped by the app
 * shell's overflow containers and is always fully visible.
 *
 * Admins also get "Login as" (switch the session to any created user), and
 * while impersonating a "Switch back" item restores the real admin account.
 */
function UserMenu({ user, onLogout, className }: UserMenuProps) {
  const { isImpersonating, switchBack } = useAuth();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showLoginAs, setShowLoginAs] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const initials =
    `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'U';

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const btn = btnRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const next = { top: r.bottom + 8, right: window.innerWidth - r.right };
      setAnchor((prev) => (prev && prev.top === next.top && prev.right === next.right ? prev : next));
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setAnchor({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`relative w-8 h-8 rounded-full bg-pink-600 text-white text-xs font-semibold flex items-center justify-center border-2 border-white shadow-sm transition hover:ring-2 hover:ring-pink-300 cursor-pointer overflow-hidden flex-shrink-0 ${
          className ?? ''
        }`}
      >
        {user.avatar_data ? (
          <img src={user.avatar_data} alt={user.full_name ?? 'User'} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
        {isImpersonating && (
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border border-white" />
        )}
      </button>

      {open &&
        anchor &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={toggle} />
            <div
              className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 w-48 text-xs"
              style={{ top: anchor.top, right: anchor.right }}
            >
              <div className="px-3 py-1.5 border-b border-slate-100">
                {isImpersonating && (
                  <div className="text-[10px] font-semibold text-amber-600 mb-0.5">
                    Viewing as {user.full_name}
                  </div>
                )}
                <div className="font-semibold text-slate-800 truncate">{user.full_name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              </div>
              <div className="px-3 py-1 text-[10px] text-slate-500">
                Role: <span className="font-semibold text-slate-700">
                  {user.user_type === 'Admin' ? 'Administrator' : user.user_type === 'Dealer' ? 'Dealer' : 'Follower'}
                </span>
              </div>
              {user.user_type === 'Admin' && !isImpersonating && (
                <button
                  onClick={() => {
                    setOpen(false);
                    setShowLoginAs(true);
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
                >
                  <FaUserGear className="text-[10px]" />
                  Login as
                </button>
              )}
              {isImpersonating && (
                <button
                  onClick={() => {
                    setOpen(false);
                    switchBack();
                  }}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
                >
                  <FaRightToBracket className="text-[10px]" />
                  Switch back
                </button>
              )}
              <button
                onClick={() => {
                  setOpen(false);
                  setShowProfile(true);
                }}
                className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
              >
                <FaGear className="text-[10px]" />
                Account settings
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  onLogout?.();
                }}
                className="w-full text-left px-3 py-2 mt-1 text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2"
              >
                <FaRightFromBracket className="text-[10px]" />
                Sign out
              </button>
            </div>
          </>,
          document.body
        )}

      {showProfile && <ProfileEditModal user={user} onClose={() => setShowProfile(false)} />}
      {showLoginAs && <LoginAsModal onClose={() => setShowLoginAs(false)} />}
    </>
  );
}

export default UserMenu;