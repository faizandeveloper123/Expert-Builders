import { useState } from 'react';
import { FaLock, FaEnvelope, FaArrowRight, FaEye, FaEyeSlash, FaCircleExclamation } from 'react-icons/fa6';
import { useAuth } from '../auth';
import BrandLogo from './BrandLogo';

interface LoginPageProps {
  onSuccess?: () => void;
}

const BRAND_BLUE = '#0A58A3';

/**
 * Expert Builders & Developers login screen. Signs a staff user in through the
 * /auth endpoint; the returned user (with their roles & permissions) drives
 * everything they can see and do after login.
 */
function LoginPage({ onSuccess }: LoginPageProps) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    try {
      await login({ email: email.trim(), password });
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message || 'Login failed. Please try again.');
    }
  };

  const inputClass =
    'w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition';

  return (
    <div className="min-h-screen flex bg-white font-sans" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Left: branding panel */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#1e2433] text-white flex-col justify-between p-12">
        <div
          className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full opacity-20 blur-3xl"
          style={{ background: BRAND_BLUE }}
        />
        <div
          className="absolute -bottom-52 -left-24 w-[520px] h-[520px] rounded-full opacity-10 blur-3xl"
          style={{ background: '#60a5fa' }}
        />

        <div className="relative flex items-center space-x-2.5">
          <BrandLogo wordmark={false} className="h-9 w-auto" />
          <span className="text-xl font-bold tracking-tight">Expert Builders</span>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Your entire <span style={{ color: BRAND_BLUE }}>customer relationship</span>, in one place.
          </h1>
          <p className="mt-4 text-slate-300 text-sm leading-relaxed">
            Expert Builders & Developers brings your leads, conversations, calendars
            and opportunities together — with role-based access so every team member
            sees exactly what they need.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[
              ['Leads', 'Track every prospect'],
              ['Roles', 'Granular permissions'],
              ['Notify', 'Real-time alerts'],
            ].map(([title, sub]) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-sm font-bold" style={{ color: BRAND_BLUE }}>
                  {title}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Expert Builders & Developers
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 lg:bg-white p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center space-x-2.5 mb-8 justify-center">
            <BrandLogo wordmark={false} className="h-9 w-auto" />
            <span className="text-2xl font-bold text-slate-800 tracking-tight">Expert Builders</span>
          </div>

          <div className="bg-white lg:bg-white rounded-2xl shadow-sm lg:shadow-lg border border-slate-200 lg:border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to your Expert Builders account to continue.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setError('Password reset coming soon')}
                    className="text-[11px] font-medium text-brand-blue hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-xs text-slate-600">Keep me signed in</span>
                </label>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-xs">
                  <FaCircleExclamation className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-white font-semibold text-sm py-2.5 rounded-lg shadow-sm transition hover:brightness-110 disabled:opacity-60"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                {loading ? 'Signing in…' : 'Sign in to Expert Builders'}
                {!loading && <FaArrowRight className="text-xs" />}
              </button>
            </form>

          </div>

          <p className="text-center text-[11px] text-slate-400 mt-6">
            Need an account? Contact your workspace administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;