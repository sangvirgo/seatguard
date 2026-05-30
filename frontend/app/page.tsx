'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isLoggedIn, getProfile, listEvents } from '../lib/api';
import EventCard from '../components/EventCard';

const featuredDemo = [
  { id: 'demo-1', name: 'Summer Music Festival 2026', venue: 'National Stadium, HCMC', category: 'CONCERT', status: 'PUBLISHED', startTime: '2026-07-15T19:00:00Z' },
  { id: 'demo-2', name: 'Tech Conference Asia', venue: 'Convention Center, Hanoi', category: 'WORKSHOP', status: 'PUBLISHED', startTime: '2026-08-20T09:00:00Z' },
  { id: 'demo-3', name: 'Champions League Final Screening', venue: 'Fan Zone, Da Nang', category: 'SPORTS', status: 'PUBLISHED', startTime: '2026-06-01T20:00:00Z' },
  { id: 'demo-4', name: 'Broadway Night: Phantom', venue: 'Opera House, HCMC', category: 'THEATER', status: 'PUBLISHED', startTime: '2026-09-10T19:30:00Z' },
  { id: 'demo-5', name: 'EDM Countdown NYE 2027', venue: 'Landmark 81, HCMC', category: 'CONCERT', status: 'PUBLISHED', startTime: '2026-12-31T22:00:00Z' },
  { id: 'demo-6', name: 'AI & Future Tech Summit', venue: 'SECC, HCMC', category: 'WORKSHOP', status: 'PUBLISHED', startTime: '2026-10-05T08:30:00Z' },
];

const steps = [
  { icon: '🔍', title: 'Choose Event', desc: 'Browse curated events near you' },
  { icon: '💺', title: 'Pick Your Seat', desc: 'Interactive seat map with real-time availability' },
  { icon: '🔒', title: 'Hold Seat', desc: 'Your seat is locked with a distributed lock' },
  { icon: '💳', title: 'Pay Securely', desc: 'Complete payment in one click' },
  { icon: '📱', title: 'Get QR Ticket', desc: 'Digital ticket with QR code, ready to scan' },
];

const trustFeatures = [
  { icon: '🔒', title: 'Concurrency-Safe Booking', desc: 'Redis distributed locks ensure no two users can book the same seat simultaneously.' },
  { icon: '📨', title: 'Kafka Ticket Issuance', desc: 'Tickets are issued asynchronously via Kafka events — reliable and fault-tolerant.' },
  { icon: '🛡️', title: 'PostgreSQL Protection', desc: 'Database-level constraints guarantee zero duplicate bookings, even under extreme load.' },
  { icon: '⚡', title: 'Idempotent Operations', desc: 'Every request has an idempotency key — retries are safe and never create duplicates.' },
];

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (isLoggedIn()) getProfile().then(u => { if (u) setUser(u); });
    listEvents().then(e => { if (e.length > 0) setEvents(e.slice(0, 6)); });
  }, []);

  const displayEvents = events.length > 0 ? events : featuredDemo;

  return (
    <div>
      {/* Cinematic Hero - full width */}
      <section className="relative pb-24 pt-20 text-center overflow-hidden">
        {/* Spotlight effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-20 left-1/4 w-[400px] h-[300px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-10 right-1/4 w-[300px] h-[200px] bg-pink-600/6 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="container-main relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Trusted by thousands of event-goers
          </div>
          <h1 className="mb-6 text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            Book your next<br />
            <span className="gradient-text">live experience</span><br />
            with confidence.
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
            Secure your seat in seconds — even when thousands are competing for the same spot.
            Our platform guarantees safe, fair, and instant booking under any level of demand.
          </p>
          {user && (
            <p className="mb-6 text-emerald-400">
              Welcome back, <strong>{user.fullName || user.email}</strong> 👋
            </p>
          )}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/events" className="btn-glow text-lg no-underline">
              Explore Events →
            </Link>
            <Link
              href="/proof"
              className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 font-semibold text-white no-underline hover:bg-white/10 transition-all"
            >
              View Engineering Proof
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="container-main mb-24">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Featured Events</h2>
            <p className="mt-1 text-sm text-gray-400">Don&apos;t miss out on these amazing experiences</p>
          </div>
          <Link href="/events" className="text-sm text-blue-400 hover:text-blue-300 no-underline transition-colors">
            View all →
          </Link>
        </div>
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {displayEvents.map((e: any) => (
            <EventCard
              key={e.id}
              id={e.id}
              name={e.name}
              venue={e.venue}
              category={e.category}
              status={e.status}
              startTime={e.startTime}
            />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container-main mb-24">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-white">How Booking Works</h2>
          <p className="mt-2 text-sm text-gray-400">Five simple steps to your perfect seat</p>
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {steps.map((step, i) => (
            <div key={i} className="glass-card p-5 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
                {i + 1}
              </div>
              <div className="mt-3 mb-3 text-3xl">{step.icon}</div>
              <h3 className="mb-1 text-sm font-semibold text-white">{step.title}</h3>
              <p className="text-xs text-gray-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="container-main mb-24">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-white">Built for Reliability</h2>
          <p className="mt-2 text-sm text-gray-400">Enterprise-grade booking you can trust</p>
        </div>
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
          {trustFeatures.map((f, i) => (
            <div key={i} className="glass-card p-6 flex gap-4">
              <div className="text-3xl flex-shrink-0">{f.icon}</div>
              <div>
                <h3 className="mb-1 font-semibold text-white">{f.title}</h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Strip */}
      <section className="container-main mb-10">
        <div className="glass-card p-6 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="text-gray-300">Tested with <strong className="text-white">14,000+</strong> concurrent requests</span>
            </div>
            <span className="hidden sm:block text-gray-600">|</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <span className="text-gray-300"><strong className="text-emerald-400">0</strong> duplicate bookings</span>
            </div>
            <span className="hidden sm:block text-gray-600">|</span>
            <Link href="/proof" className="text-blue-400 hover:text-blue-300 no-underline transition-colors">
              See the proof →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
