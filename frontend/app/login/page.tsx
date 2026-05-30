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

  useEffect(() => { if (isLoggedIn()) getProfile().then(u => { if (u) setUser(u); }); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMsg('');
    const res = mode === 'login' ? await login(email, password) : await register(email, password, fullName);
    if (res.ok) {
      const profile = await getProfile();
      setUser(profile);
      setMsg(`${mode === 'login' ? 'Logged in' : 'Registered'}!`);
      setMsgType('success');
    } else {
      setMsg(res.data?.message || 'Failed');
      setMsgType('error');
    }
    setLoading(false);
  }

  if (user) {
    return (
      <div className="mx-auto max-w-md py-16">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
          <div className="mb-4 text-5xl">👤</div>
          <h2 className="text-xl font-bold">{user.fullName}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{user.email}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Role: {user.role} · ID: {user.id?.slice(0, 8)}...</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => { logout(); setUser(null); }} className="rounded-lg border border-[var(--color-border)] px-5 py-2 text-sm hover:bg-[var(--color-bg-hover)] transition-colors">Logout</button>
            <a href="/events" className="rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white no-underline hover:bg-[var(--color-accent-hover)] transition-colors">Browse Events →</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8">
        <h2 className="mb-6 text-center text-xl font-bold">{mode === 'login' ? '🔐 Login' : '📝 Register'}</h2>
        {msg && <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${msgType === 'error' ? 'border-red-800 bg-red-950 text-red-300' : 'border-emerald-800 bg-emerald-950 text-emerald-300'}`}>{msg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="mb-1 block text-xs text-[var(--color-text-muted)]">Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--color-text-muted)]">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-[var(--color-accent)] py-2.5 font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors">
            {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
          {mode === 'login' ? (
            <>No account? <button onClick={() => setMode('register')} className="text-[var(--color-accent)] hover:underline">Register</button></>
          ) : (
            <>Have account? <button onClick={() => setMode('login')} className="text-[var(--color-accent)] hover:underline">Login</button></>
          )}
        </p>
      </div>
    </div>
  );
}
