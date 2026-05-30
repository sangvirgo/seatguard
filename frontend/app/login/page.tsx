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
    if (isLoggedIn()) {
      getProfile().then(u => { if (u) setUser(u); });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = mode === 'login'
        ? await login(email, password)
        : await register(email, password, fullName);

      if (res.ok) {
        const profile = await getProfile();
        setUser(profile);
        setMsg(`${mode === 'login' ? 'Logged in' : 'Registered'} successfully!`);
        setMsgType('success');
      } else {
        setMsg(`${mode === 'login' ? 'Login' : 'Registration'} failed: ${res.data?.message || JSON.stringify(res.data)}`);
        setMsgType('error');
      }
    } catch (e: any) {
      setMsg('Error: ' + e.message);
      setMsgType('error');
    }
    setLoading(false);
  }

  function handleLogout() {
    logout();
    setUser(null);
    setMsg('Logged out');
    setMsgType('success');
  }

  if (user) {
    return (
      <div style={{ maxWidth: 400, margin: '60px auto' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 16 }}>👤 Profile</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: 8 }}><strong>{user.fullName}</strong></p>
          <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>{user.email}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 24 }}>
            Role: {user.role} · ID: {user.id?.slice(0, 8)}...
          </p>
          <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
          <div style={{ marginTop: 16 }}>
            <a href="/events" className="btn btn-primary">Browse Events →</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '60px auto' }}>
      <div className="card">
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>
          {mode === 'login' ? '🔐 Login' : '📝 Register'}
        </h2>

        {msg && <div className={`msg msg-${msgType}`}>{msg}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {mode === 'login' ? (
            <>Don&apos;t have an account? <button onClick={() => setMode('register')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Register</button></>
          ) : (
            <>Already have an account? <button onClick={() => setMode('login')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Login</button></>
          )}
        </p>
      </div>
    </div>
  );
}
