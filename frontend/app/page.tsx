'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isLoggedIn, getProfile, listEvents } from '../lib/api';
import EventCard from '../components/EventCard';
import {
  Search, Armchair, Lock, CreditCard, QrCode,
  ShieldCheck, Zap, Smartphone, Users
} from 'lucide-react';

const featuredDemo = [
  { id: 'demo-1', name: 'Summer Music Festival 2026', venue: 'National Stadium, HCMC', category: 'CONCERT', status: 'PUBLISHED', startTime: '2026-07-15T19:00:00Z' },
  { id: 'demo-2', name: 'Tech Conference Asia', venue: 'Convention Center, Hanoi', category: 'WORKSHOP', status: 'PUBLISHED', startTime: '2026-08-20T09:00:00Z' },
  { id: 'demo-3', name: 'Champions League Final Screening', venue: 'Fan Zone, Da Nang', category: 'SPORTS', status: 'PUBLISHED', startTime: '2026-06-01T20:00:00Z' },
  { id: 'demo-4', name: 'Broadway Night: Phantom', venue: 'Opera House, HCMC', category: 'THEATER', status: 'PUBLISHED', startTime: '2026-09-10T19:30:00Z' },
  { id: 'demo-5', name: 'EDM Countdown NYE 2027', venue: 'Landmark 81, HCMC', category: 'CONCERT', status: 'PUBLISHED', startTime: '2026-12-31T22:00:00Z' },
  { id: 'demo-6', name: 'AI & Future Tech Summit', venue: 'SECC, HCMC', category: 'WORKSHOP', status: 'PUBLISHED', startTime: '2026-10-05T08:30:00Z' },
];

const steps = [
  { icon: Search, title: 'Browse Events', desc: 'Find your perfect event' },
  { icon: Armchair, title: 'Pick Your Seat', desc: 'Interactive seat map' },
  { icon: Lock, title: 'Hold Your Seat', desc: 'Instant seat lock' },
  { icon: CreditCard, title: 'Pay Securely', desc: 'Safe payment' },
  { icon: QrCode, title: 'Get QR Ticket', desc: 'Digital ticket for check-in' },
];

const features = [
  { icon: ShieldCheck, title: 'Guaranteed Seat Protection', desc: 'Your seat is locked the moment you select it. No double-booking, ever.' },
  { icon: Zap, title: 'Instant Confirmation', desc: 'Get real-time booking confirmation within seconds of payment.' },
  { icon: Smartphone, title: 'QR Check-in', desc: 'Seamless entry with digital QR tickets. No paper needed.' },
  { icon: Users, title: 'High-Demand Ready', desc: 'Handles massive concurrent traffic so you never miss out on popular events.' },
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
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden pb-24 pt-20 text-center">
        {/* Glow effects */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/12 rounded-full blur-[140px]" />
        <div className="pointer-events-none absolute top-32 left-1/4 w-[500px] h-[350px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute top-16 right-1/4 w-[350px] h-[250px] bg-pink-600/8 rounded-full blur-[100px]" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {user && (
            <p className="mb-6 text-emerald-400">
              Welcome back, <strong>{user.fullName || user.email}</strong> 👋
            </p>
          )}
          <h1 className="mb-6 text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight text-white">
            Discover Unforgettable<br />
            <span className="gradient-text">Live Experiences</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
            Book concert tickets, sports events, and more with guaranteed seat protection.
            No double-booking, ever.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/events" className="inline-block bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl px-8 py-3.5 text-lg font-semibold no-underline shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all">
              Browse Events
            </Link>
            <Link
              href="/tickets"
              className="inline-block rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-lg font-semibold text-white no-underline hover:bg-white/10 transition-all"
            >
              My Tickets
            </Link>
          </div>
          <div className="mt-8">
            <Link href="/proof" className="text-xs text-gray-600 hover:text-gray-400 no-underline transition-colors">
              Engineering proof →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ UPCOMING EVENTS ═══════════ */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mb-24">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Upcoming Events</h2>
            <p className="mt-1 text-sm text-gray-400">Don&apos;t miss out on these amazing experiences</p>
          </div>
          <Link href="/events" className="text-sm text-blue-400 hover:text-blue-300 no-underline transition-colors">
            View all →
          </Link>
        </div>
        {displayEvents.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
        ) : (
          <div className="glass-card p-12 text-center">
            <p className="text-gray-400 text-lg">No events yet</p>
            <p className="text-gray-500 text-sm mt-2">Check back soon for upcoming events!</p>
          </div>
        )}
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mb-24">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-white">How SeatGuard Works</h2>
          <p className="mt-2 text-sm text-gray-400">Five simple steps to your perfect seat</p>
        </div>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="glass-card overflow-hidden p-6 text-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/30">
                  {i + 1}
                </div>
                <div className="mt-5 mb-4 flex justify-center">
                  <Icon className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white leading-snug">{step.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════ WHY SEATGUARD ═══════════ */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mb-24">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-white">Why Choose SeatGuard</h2>
          <p className="mt-2 text-sm text-gray-400">Built for reliability, designed for you</p>
        </div>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="glass-card overflow-hidden p-6 flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="mb-2 font-semibold text-white leading-snug">{f.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <span className="text-sm font-bold text-white">Seat<span className="gradient-text">Guard</span></span>
            </div>
            {/* Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link href="/events" className="text-gray-400 hover:text-white no-underline transition-colors">Events</Link>
              <Link href="/tickets" className="text-gray-400 hover:text-white no-underline transition-colors">My Tickets</Link>
              <Link href="/proof" className="text-gray-600 hover:text-gray-400 no-underline transition-colors text-xs">Engineering proof</Link>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600">&copy; 2026 SeatGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
