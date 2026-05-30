'use client';

import { useEffect, useState } from 'react';
import { isLoggedIn, getProfile } from '../lib/api';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isLoggedIn()) {
      getProfile().then(u => { if (u) setUser(u); });
    }
  }, []);

  return (
    <div>
      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '60px 0 40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 12 }}>
          🛡️ <span style={{ color: 'var(--accent)' }}>Seat</span>Guard
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 32px' }}>
          High-Concurrency Ticket Booking Platform — Zero double-booking under extreme load.
        </p>
        {user ? (
          <p style={{ color: 'var(--success)', marginBottom: 24 }}>
            Welcome back, <strong>{user.fullName || user.email}</strong>!
          </p>
        ) : null}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href="/events" className="btn btn-primary">Browse Events →</a>
          <a href="/proof" className="btn btn-outline">View Proof</a>
        </div>
      </section>

      {/* Proof Cards */}
      <section style={{ marginTop: 48 }}>
        <h2 className="section-title" style={{ textAlign: 'center' }}>Proven Results</h2>
        <div className="proof-grid">
          <div className="proof-card success">
            <div className="value">22/22</div>
            <div className="label">API Tests PASS</div>
          </div>
          <div className="proof-card">
            <div className="value">14,374</div>
            <div className="label">k6 Requests</div>
          </div>
          <div className="proof-card success">
            <div className="value">1</div>
            <div className="label">Successful Booking</div>
          </div>
          <div className="proof-card error">
            <div className="value">14,364</div>
            <div className="label">Conflicts (409)</div>
          </div>
          <div className="proof-card success">
            <div className="value">0</div>
            <div className="label">DB Duplicates</div>
          </div>
          <div className="proof-card">
            <div className="value">427ms</div>
            <div className="label">p95 Latency</div>
          </div>
          <div className="proof-card">
            <div className="value">3.8GB</div>
            <div className="label">RAM During k6</div>
          </div>
          <div className="proof-card">
            <div className="value">10/10</div>
            <div className="label">Services Running</div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section style={{ marginTop: 64 }}>
        <h2 className="section-title" style={{ textAlign: 'center' }}>Architecture</h2>
        <div className="card" style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.8, whiteSpace: 'pre', overflow: 'auto', textAlign: 'center' }}>
{`┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend   │────▶│ API Gateway  │────▶│  Auth Service   │
│  (Next.js)   │     │ (Spring Cloud)│     │   JWT + BCrypt  │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
        ┌──────────┬───────┼───────┬──────────┐
        ▼          ▼       ▼       ▼          ▼
  ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
  │  Event   ││ Booking  ││  Ticket  ││   Notif  ││  Kafka   │
  │ Service  ││ Service  ││ Service  ││ Service  ││  Events  │
  └──────────┘└──────────┘└──────────┘└──────────┘└──────────┘`}
        </div>
      </section>
    </div>
  );
}
