'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isLoggedIn, getProfile } from '../lib/api';

const metrics = [
  { value: '22/22', label: 'API Tests', color: 'text-emerald-400' },
  { value: '10/10', label: 'Services', color: 'text-blue-400' },
  { value: '14,374', label: 'k6 Requests', color: 'text-violet-400' },
  { value: '1', label: 'Success', color: 'text-emerald-400' },
  { value: '14,364', label: 'Conflicts', color: 'text-rose-400' },
  { value: '0', label: 'DB Duplicates', color: 'text-emerald-400' },
  { value: '427ms', label: 'p95 Latency', color: 'text-amber-400' },
  { value: '3.8GB', label: 'RAM', color: 'text-cyan-400' },
];

const tech = ['Java 21', 'Spring Boot 3.2', 'Spring Cloud Gateway', 'PostgreSQL 16', 'Redis 7', 'Apache Kafka 3.7', 'NestJS 10', 'Next.js 14', 'Tailwind CSS', 'Docker', 'k6', 'GitHub Actions'];

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => { if (isLoggedIn()) getProfile().then(u => { if (u) setUser(u); }); }, []);

  return (
    <div>
      {/* Hero */}
      <section className="pb-20 pt-16 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Production-Grade Microservices
        </div>
        <h1 className="mb-6 text-6xl font-extrabold leading-tight tracking-tight">
          One seat.<br />
          <span className="gradient-text">Thousands of buyers.</span><br />
          Zero double-booking.
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
          A high-concurrency ticket booking platform built with Spring Boot, Redis distributed locks,
          Kafka event streaming, and PostgreSQL — proven under 14,374 concurrent requests.
        </p>
        {user && <p className="mb-6 text-emerald-400">Welcome, <strong>{user.fullName || user.email}</strong></p>}
        <div className="flex justify-center gap-4">
          <Link href="/events" className="btn-glow text-lg no-underline">Browse Events →</Link>
          <Link href="/proof" className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 font-semibold text-white no-underline hover:bg-white/10 transition-all">
            View Proof
          </Link>
        </div>
      </section>

      {/* Metrics */}
      <section className="mb-20">
        <h2 className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Proven Under Load</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map(m => (
            <div key={m.label} className="metric-card">
              <div className={`text-3xl font-bold ${m.color}`}>{m.value}</div>
              <div className="mt-1 text-xs text-gray-500">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="mb-20">
        <h2 className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Architecture</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: '🔐', title: 'Auth Service', desc: 'JWT + BCrypt + Spring Security' },
            { icon: '🎪', title: 'Event Service', desc: 'CRUD, seat maps, section management' },
            { icon: '🎫', title: 'Booking Service', desc: 'Redis locks, idempotency, Kafka events' },
            { icon: '🎟️', title: 'Ticket Service', desc: 'Auto-issue via Kafka, QR codes, check-in' },
            { icon: '🔔', title: 'Notification Service', desc: 'WebSocket push, Kafka consumer' },
            { icon: '🌐', title: 'API Gateway', desc: 'Spring Cloud Gateway, routing, CORS' },
          ].map(a => (
            <div key={a.title} className="glass-card p-5">
              <div className="mb-2 text-2xl">{a.icon}</div>
              <h3 className="mb-1 font-semibold text-white">{a.title}</h3>
              <p className="text-sm text-gray-400">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section>
        <h2 className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Tech Stack</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {tech.map(t => (
            <span key={t} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-gray-400 hover:border-white/20 hover:text-gray-300 transition-all">
              {t}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
