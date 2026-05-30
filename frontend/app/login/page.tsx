'use client';

import { useState, useEffect } from 'react';
import { register, login, logout, isLoggedIn, getProfile } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('demo@seatguard.com');
  const [password, setPassword] = useState('DemoPass123!');
  const [fullName, setFullName] = useState('Demo User');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isLoggedIn()) getProfile().then(u => { if (u) setUser(u); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const res = mode === 'login' ? await login(email, password) : await register(email, password, fullName);
    if (res.ok) {
      const profile = await getProfile();
      setUser(profile);
      setMsg(`${mode === 'login' ? 'Logged in' : 'Registered'} successfully!`);
      setMsgType('success');
    } else {
      setMsg(res.data?.message || 'Authentication failed. Please check your credentials.');
      setMsgType('error');
    }
    setLoading(false);
  }

  function handleLogout() {
    logout();
    setUser(null);
    setMsg('Logged out.');
    setMsgType('success');
  }

  if (user) {
    return (
      <div className="py-16">
        <div className="mx-auto max-w-md relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="relative glass-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-3xl">
              👤
            </div>
            <h2 className="text-xl font-bold text-white">{user.fullName}</h2>
            <p className="text-sm text-gray-400">{user.email}</p>
            <p className="mt-1 text-xs text-gray-500">Role: {user.role} · ID: {user.id?.slice(0, 8)}...</p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={handleLogout}
                className="rounded-lg border border-white/10 px-5 py-2 text-sm hover:bg-white/5 transition-all"
              >
                Logout
              </button>
              <a href="/events" className="btn-glow no-underline text-center">
                Browse Events →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16">
      <div className="mx-auto max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative glass-card p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-2xl">
              {mode === 'login' ? '🔐' : '📝'}
            </div>
            <h2 className="text-2xl font-bold text-white">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {mode === 'login' ? 'Sign in to book your next event' : 'Join SeatGuard to start booking'}
            </p>
          </div>

          {msg && (
            <div className={`mb-4 ${msgType === 'error' ? 'toast-error' : 'toast-success'}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Your full name" />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-glow w-full text-center disabled:opacity-50">
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>Don&apos;t have an account?{' '}
                <button onClick={() => setMode('register')} className="text-blue-400 hover:underline font-medium">Register</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-blue-400 hover:underline font-medium">Sign In</button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
