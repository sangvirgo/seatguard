'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isLoggedIn, getProfile } from '../lib/api';

const proofs = [
  { value: '22/22', label: 'API Tests', color: 'text-emerald-400' },
  { value: '14,374', label: 'k6 Requests', color: 'text-blue-400' },
  { value: '1', label: 'Successful Booking', color: 'text-emerald-400' },
  { value: '14,364', label: 'Conflicts (409)', color: 'text-red-400' },
  { value: '0', label: 'DB Duplicates', color: 'text-emerald-400' },
  { value: '427ms', label: 'p95 Latency', color: 'text-blue-400' },
  { value: '469/s', label: 'Throughput', color: 'text-blue-400' },
  { value: '3.8GB', label: 'RAM During k6', color: 'text-yellow-400' },
];

export default function HomePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isLoggedIn()) getProfile().then(u => { if (u) setUser(u); });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="py-16 text-center">
        <div className="mb-2 text-sm font-medium uppercase tracking-widest text-[var(--color-text-muted)]">High-Concurrency Ticket Booking Platform</div>
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight">
          🛡️ <span className="text-[var(--color-accent)]">Seat</span>Guard
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-lg text-[var(--color-text-muted)]">
          Zero double-booking under <span className="font-semibold text-[var(--color-text)]">14,374 concurrent requests</span>.
          Production-grade microservices with Redis locks, Kafka events, and PostgreSQL.
        </p>
        {user && (
          <p className="mb-6 text-emerald-400">Welcome back, <strong>{user.fullName || user.email}</strong>!</p>
        )}
        <div className="flex justify-center gap-4">
          <Link href="/events" className="rounded-xl bg-[var(--color-accent)] px-8 py-3 font-semibold text-white no-underline hover:bg-[var(--color-accent-hover)] transition-colors">
            Browse Events →
          </Link>
          <Link href="/proof" className="rounded-xl border border-[var(--color-border)] px-8 py-3 font-semibold text-[var(--color-text)] no-underline hover:bg-[var(--color-bg-hover)] transition-colors">
            View Proof
          </Link>
        </div>
      </section>

      {/* Proof Grid */}
      <section className="mt-8">
        <h2 className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Proven Results</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {proofs.map(p => (
            <div key={p.label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 text-center transition-colors hover:border-[#333]">
              <div className={`text-3xl font-bold ${p.color}`}>{p.value}</div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">{p.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="mt-16">
        <h2 className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Architecture</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          <pre className="text-center text-xs leading-relaxed text-[var(--color-text-muted)]">
{`┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend   │────▶│ API Gateway  │────▶│  Auth Service   │
│  Next.js 14  │     │ Spring Cloud │     │  JWT + BCrypt   │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
        ┌──────────┬───────┼───────┬──────────┐
        ▼          ▼       ▼       ▼          ▼
  ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
  │  Event   ││ Booking  ││  Ticket  ││   Notif  ││  Kafka   │
  │ Service  ││ Service  ││ Service  ││ Service  ││  Events  │
  └──────────┘└──────────┘└──────────┘└──────────┘└──────────┘`}
          </pre>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mt-16 mb-8">
        <h2 className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Tech Stack</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {['Java 21', 'Spring Boot 3.2', 'PostgreSQL 16', 'Redis 7', 'Apache Kafka 3.7', 'NestJS', 'Next.js 14', 'TypeScript', 'Docker', 'k6'].map(t => (
            <span key={t} className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
              {t}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
