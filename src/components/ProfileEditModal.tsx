import { useState } from 'react';
import {
  FaCamera,
  FaCircleExclamation,
  FaCircleCheck,
  FaXmark,
  FaFloppyDisk,
  FaKey,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa6';
import type { ApiStaffUser } from '../api';
import { api } from '../api';
import { fileToResizedDataUrl } from '../utils';
import { useAuth } from '../auth';

interface ProfileEditModalProps {
  user: ApiStaffUser;
  onClose: () => void;
}

/**
 * Lets the signed-in user edit their own profile from the top bar: display
 * picture (DP), name, email and password. Password changes must be confirmed
 * with the current password (verified via the /auth endpoint). Saving keeps
 * the user's role & permissions intact (see AuthContext.updateUser).
 */
function ProfileEditModal({ user, onClose }: ProfileEditModalProps) {
  const { updateUser } = useAuth();

  const initials =
    `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'U';

  const [firstName, setFirstName] = useState(user.first_name ?? '');
  const [lastName, setLastName] = useState(user.last_name ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [avatarData, setAvatarData] = useState<string | null>(user.avatar_data ?? null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /** Show/hide the account's current password (stored alongside the hash). */
  const handleRevealPassword = async () => {
    if (showPassword) {
      setShowPassword(false);
      return;
    }
    setError(null);
    setRevealLoading(true);
    try {
      const res = await api.revealPassword(user.email ?? '');
      setRevealedPassword(res.data.password);
      setShowPassword(true);
    } catch (err) {
      setError((err as Error).message || 'Could not load your password.');
    } finally {
      setRevealLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    fileToResizedDataUrl(file)
      .then((data) => setAvatarData(data))
      .catch((err) => setError((err as Error).message || 'Could not read the image'));
    e.target.value = '';
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    const wantPassword = newPassword !== '' || confirmPassword !== '';
    if (wantPassword) {
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation do not match.');
        return;
      }
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters long.');
        return;
      }
      if (!currentPassword) {
        setError('Enter your current password to set a new one.');
        return;
      }
    }

    setSaving(true);
    try {
      if (wantPassword) {
        const verified = await api.login({
          email: user.email ?? '',
          password: currentPassword,
        });
        if (!verified.data) throw new Error('Current password is incorrect.');
      }

      await updateUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        avatar_data: avatarData,
        ...(wantPassword ? { password: newPassword } : {}),
      });

      setSuccess('Profile updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      window.setTimeout(onClose, 900);
    } catch (err) {
      setError((err as Error).message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Account settings</h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <FaXmark />
          </button>
        </div>

        <div className="px-5 py-5 overflow-y-auto space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-pink-600 text-white text-xl font-semibold flex items-center justify-center overflow-hidden border-2 border-white shadow-md flex-shrink-0">
              {avatarData ? (
                <img src={avatarData} alt="DP" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="space-y-1.5">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-orange-600 hover:underline">
                <FaCamera />
                Upload photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
              {avatarData && (
                <button
                  type="button"
                  onClick={() => setAvatarData(null)}
                  className="block text-[11px] text-red-600 hover:underline"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Name / email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">First name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>

          {/* Password */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
              <FaKey className="text-slate-400 text-xs" />
              Password
            </div>

            {/* Current password (view) */}
            <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 mb-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Current password
                </p>
                <p className="text-sm font-mono text-slate-800 truncate">
                  {!user.email
                    ? 'Save an email first'
                    : showPassword
                      ? revealedPassword || 'Not saved'
                      : '••••••••'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleRevealPassword()}
                disabled={!user.email || revealLoading}
                className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition disabled:opacity-50"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
                {revealLoading ? 'Loading…' : showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-3">
              Change password
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Required only when setting a new password"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm new</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-xs">
              <FaCircleExclamation className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2.5 text-xs">
              <FaCircleCheck className="mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition disabled:opacity-60"
          >
            <FaFloppyDisk className="text-[11px]" />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileEditModal;