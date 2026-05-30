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
    } else { setMsg(res.data?.message || 'Failed'); setMsgType('error'); }
    setLoading(false);
  }

  if (user) {
    return (
      <div className="mx-auto max-w-md py-16">
        <div className="glass-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-3xl">
            👤
          </div>
          <h2 className="text-xl font-bold text-white">{user.fullName}</h2>
          <p className="text-sm text-gray-400">{user.email}</p>
          <p className="mt-1 text-xs text-gray-500">Role: {user.role} · ID: {user.id?.slice(0, 8)}...</p>
          <div className="mt-8 flex justify-center gap-3">
            <button onClick={() => { logout(); setUser(null); }} className="rounded-lg border border-white/10 px-5 py-2 text-sm hover:bg-white/5 transition-all">Logout</button>
            <a href="/events" className="btn-glow no-underline">Browse Events →</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <div className="glass-card p-8">
        <h2 className="mb-6 text-center text-2xl font-bold text-white">{mode === 'login' ? '🔐 Welcome Back' : '📝 Create Account'}</h2>
        {msg && <div className={`mb-4 ${msgType === 'error' ? 'toast-error' : 'toast-success'}`}>{msg}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="btn-glow w-full text-center disabled:opacity-50">
            {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          {mode === 'login' ? (
            <>No account? <button onClick={() => setMode('register')} className="text-blue-400 hover:underline">Register</button></>
          ) : (
            <>Have account? <button onClick={() => setMode('login')} className="text-blue-400 hover:underline">Login</button></>
          )}
        </p>
      </div>
    </div>
  );
}
