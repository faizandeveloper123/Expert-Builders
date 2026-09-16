import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ApiStaffUser, LoginInput, StaffInput } from './api';
import { api } from './api';

/**
 * AuthProvider owns the "who is logged in" state for the whole app.
 *
 * The session is persisted in localStorage so a browser refresh keeps the
 * user signed in. Roles & permissions come straight from the staff_users
 * record that was selected when the user was created (Settings -> My Staff),
 * so after login the user only sees/does what was enabled for them.
 */

const SESSION_KEY = 'evee_auth_session_v1';
/** Holds the real admin while an admin is using "Login as" to view another user. */
const IMPERSONATION_KEY = 'evee_impersonation_v1';

interface AuthContextValue {
  /** The logged-in staff user (null when signed out). */
  user: ApiStaffUser | null;
  loading: boolean;
  /** True while an Admin is viewing the app as another user via "Login as". */
  isImpersonating: boolean;
  login: (input: LoginInput) => Promise<ApiStaffUser>;
  /**
   * Install an already-fetched staff user as the active session (used by the
   * one-click magic-login link in approval emails).
   */
  completeLogin: (user: ApiStaffUser) => void;
  logout: () => void;
  /** Admin-only: switch the session to another staff user (any role). */
  loginAs: (staffId: number) => Promise<ApiStaffUser>;
  /** Restore the real admin account after "Login as". */
  switchBack: () => void;
  /**
   * Save profile changes for the signed-in user. Sends the user's full current
   * profile merged with `changes` so admin role, permissions and JSON config
   * are never wiped by a profile edit. Re-fetches the fresh row afterwards and
   * updates the session in place.
   */
  updateUser: (changes: StaffInput) => Promise<ApiStaffUser>;
  /**
   * True for Admins, or when at least one permission under the given
   * permission category id (e.g. 'contacts', 'conversations') is enabled.
   */
  hasPermission: (categoryId: string) => boolean;
  /** True only when the exact "category:item" permission is enabled. */
  hasExactPermission: (key: string) => boolean;
  /**
   * True only when the exact granular action key is enabled, e.g.
   * `hasActionPermission('contacts', 'Contacts', 'delete')` -> `contacts:Contacts:delete`.
   * Admins always pass.
   */
  hasActionPermission: (categoryId: string, label: string, action: string) => boolean;
  /**
   * True for Admins, or when at least one "edit" permission under the given
   * category is enabled. Used to gate mutating actions (add/edit/delete).
   */
  hasEditPermission: (categoryId: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(key: string): ApiStaffUser | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as ApiStaffUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiStaffUser | null>(() => readStored(SESSION_KEY));
  const [originalUser, setOriginalUser] = useState<ApiStaffUser | null>(() =>
    readStored(IMPERSONATION_KEY)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore storage errors */
    }
  }, [user]);

  useEffect(() => {
    try {
      if (originalUser) localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(originalUser));
      else localStorage.removeItem(IMPERSONATION_KEY);
    } catch {
      /* ignore storage errors */
    }
  }, [originalUser]);

  const login = useCallback(async (input: LoginInput): Promise<ApiStaffUser> => {
    setLoading(true);
    try {
      const res = await api.login(input);
      setOriginalUser(null);
      setUser(res.data);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeLogin = useCallback((u: ApiStaffUser) => {
    setOriginalUser(null);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setOriginalUser(null);
  }, []);

  const loginAs = useCallback(
    async (staffId: number): Promise<ApiStaffUser> => {
      if (!user || user.user_type !== 'Admin') throw new Error('Only admins can use "Login as".');
      const res = await api.getStaff(staffId);
      if (!res.data) throw new Error('Staff user not found');
      setOriginalUser(user);
      setUser(res.data);
      return res.data;
    },
    [user]
  );

  const switchBack = useCallback(() => {
    if (!originalUser) return;
    setUser(originalUser);
    setOriginalUser(null);
  }, [originalUser]);

  const updateUser = useCallback(
    async (changes: StaffInput): Promise<ApiStaffUser> => {
      if (!user) throw new Error('Not signed in');
      const payload: StaffInput = {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email ?? undefined,
        phone: user.phone ?? undefined,
        extension: user.extension ?? undefined,
        user_type: user.user_type,
        restrict_data: user.restrict_data === 1,
        signature: user.signature ?? undefined,
        system_id: user.system_id ?? undefined,
        calendar: user.calendar ?? undefined,
        avatar_data: user.avatar_data ?? null,
        call_voicemail: user.call_voicemail ?? undefined,
        availability: user.availability ?? undefined,
        calendar_config: user.calendar_config ?? undefined,
        permissions: user.permissions ?? {},
        ...changes,
      };
      await api.updateStaff(user.id, payload);
      const fresh = await api.getStaff(user.id);
      setUser(fresh.data);
      return fresh.data;
    },
    [user]
  );

  const hasPermission = useCallback(
    (categoryId: string): boolean => {
      if (!user) return false;
      if (user.user_type === 'Admin') return true;
      const perms = user.permissions ?? {};
      return Object.keys(perms).some(
        (k) => k.startsWith(`${categoryId}:`) && perms[k] === true
      );
    },
    [user]
  );

  const hasExactPermission = useCallback(
    (key: string): boolean => {
      if (!user) return false;
      if (user.user_type === 'Admin') return true;
      return (user.permissions ?? {})[key] === true;
    },
    [user]
  );

  const hasActionPermission = useCallback(
    (categoryId: string, label: string, action: string): boolean => {
      if (!user) return false;
      if (user.user_type === 'Admin') return true;
      return (user.permissions ?? {})[`${categoryId}:${label}:${action}`] === true;
    },
    [user]
  );

  const hasEditPermission = useCallback(
    (categoryId: string): boolean => {
      if (!user) return false;
      if (user.user_type === 'Admin') return true;
      const perms = user.permissions ?? {};
      return Object.keys(perms).some(
        (k) => k.startsWith(`${categoryId}:`) && k.endsWith(':edit') && perms[k] === true
      );
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isImpersonating: originalUser !== null,
      login,
      completeLogin,
      logout,
      loginAs,
      switchBack,
      updateUser,
      hasPermission,
      hasExactPermission,
      hasActionPermission,
      hasEditPermission,
    }),
    [user, loading, originalUser, login, completeLogin, logout, loginAs, switchBack, updateUser, hasPermission, hasExactPermission, hasActionPermission, hasEditPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
