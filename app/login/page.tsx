'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Mode = 'signin' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupAddress, setSignupAddress] = useState('');

  const isSignIn = mode === 'signin';
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signinEmail, password: signinPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign in failed');
      setMessage(`Signed in as ${data.user?.name || data.user?.email}`);
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          phone: signupPhone || null,
          address: signupAddress || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign up failed');
      setMessage(`Account created for ${data.user?.name || data.user?.email}`);
      router.push('/profile');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-18 min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl rounded-2xl bg-slate-950/70 border border-slate-800 shadow-2xl backdrop-blur-sm overflow-hidden relative">
        {/* Sliding door */}
        <div
          className={`absolute top-0 bottom-0 w-1/2 bg-slate-950 border border-slate-900 transition-transform duration-500 ease-in-out z-10 hidden md:block ${
            isSignIn ? 'translate-x-full' : 'translate-x-0'
          }`}
          aria-hidden
        />

        <div className="grid md:grid-cols-2 relative">
          {/* Left = Sign In */}
          <div className={`p-10 md:p-12 transition-opacity duration-500 ${isSignIn ? 'opacity-100' : 'opacity-60'}`}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold">Welcome Back</h2>
            </div>
            {(error && isSignIn) && (
              <div className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-700 rounded-lg p-3">
                {error}
              </div>
            )}
            {(message && isSignIn) && (
              <div className="mb-4 text-sm text-emerald-300 bg-emerald-900/20 border border-emerald-700 rounded-lg p-3">
                {message}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSignIn}>
              <div>
                <label className="block text-sm mb-1 text-[color:var(--text-primary)]">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  placeholder="you@example.com"
                  value={signinEmail}
                  onChange={(e) => setSigninEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-[color:var(--text-primary)]">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 focus:border-blue-500 focus:outline-none"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={signinPassword}
                  onChange={(e) => setSigninPassword(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-[color:var(--text-muted)]">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="rounded border-slate-600 bg-slate-900" />
                  Remember me
                </label>
                <Link href="#" className="text-blue-300 hover:text-blue-200">
                  Forgot password?
                </Link>
              </div>
              <div className="space-y-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold transition-colors disabled:opacity-60"
                  disabled={loading}
                >
                  {loading && isSignIn ? 'Signing in...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="w-full py-3 rounded-lg border border-slate-700 hover:border-blue-400 text-[color:var(--text-primary)]"
                >
                  Switch to Sign Up
                </button>
              </div>
            </form>
          </div>

          {/* Right = Sign Up */}
          <div className={`p-10 md:p-12 transition-opacity duration-500 ${!isSignIn ? 'opacity-100' : 'opacity-60'}`}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold">Create Account</h2>
            </div>
            {(error && !isSignIn) && (
              <div className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-700 rounded-lg p-3">
                {error}
              </div>
            )}
            {(message && !isSignIn) && (
              <div className="mb-4 text-sm text-emerald-300 bg-emerald-900/20 border border-emerald-700 rounded-lg p-3">
                {message}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSignUp}>
              <div>
                <label className="block text-sm mb-1 text-[color:var(--text-primary)]">Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                  placeholder="Full name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-[color:var(--text-primary)]">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-[color:var(--text-primary)]">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                  placeholder="Create a password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-[color:var(--text-primary)]">Phone (optional)</label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                  placeholder="+1 555 555 1234"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-[color:var(--text-primary)]">Address (optional)</label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none"
                  placeholder="Shipping address"
                  value={signupAddress}
                  onChange={(e) => setSignupAddress(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold transition-colors disabled:opacity-60"
                  disabled={loading}
                >
                  {loading && !isSignIn ? 'Signing up...' : 'Sign Up'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="w-full py-3 rounded-lg border border-slate-700 hover:border-emerald-400 text-[color:var(--text-primary)]"
                >
                  Switch to Sign In
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex justify-center gap-4 p-4 border-t border-slate-800 bg-slate-900/70">
          <button
            onClick={() => setMode('signin')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              isSignIn ? 'bg-blue-600' : 'bg-slate-800 text-[color:var(--text-muted)]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              !isSignIn ? 'bg-emerald-600' : 'bg-slate-800 text-[color:var(--text-muted)]'
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}


