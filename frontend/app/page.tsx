'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isLoggedIn, getProfile, listEvents } from '../lib/api';
import EventCard from '../components/EventCard';
import {
  Search, Armchair, Lock, CreditCard, QrCode,
  ShieldCheck, Zap, Smartphone, Users
} from 'lucide-react';

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
    listEvents().then(e => setEvents(e.slice(0, 6)));
  }, []);

  return (
    <div>
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden pb-24 pt-20 text-center">
        {/* Glow effects — reduced size */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute top-32 left-1/4 w-[350px] h-[250px] bg-violet-600/8 rounded-full blur-[100px]" />
        <div className="pointer-events-none absolute top-16 right-1/4 w-[250px] h-[180px] bg-pink-600/6 rounded-full blur-[80px]" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {user && (
            <p className="mb-6 text-emerald-400">
              Welcome back, <strong>{user.fullName || user.email}</strong> 👋
            </p>
          )}
          <h1 className="mb-6 text-3xl sm:text-4xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white">
            Discover Unforgettable<br />
            <span className="gradient-text">Live Experiences</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400">
            Book concert tickets, sports events, and more with guaranteed seat protection.
            No double-booking, ever.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/events" className="btn-glow btn-glow-vivid inline-flex items-center gap-2 text-lg !px-8 !py-3.5">
              Browse Events <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/tickets"
              className="inline-block rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-lg font-semibold text-white no-underline hover:bg-white/10 transition-all"
            >
              My Tickets
            </Link>
          </div>
          <div className="mt-8">
            <Link href="/proof" className="text-xs text-gray-500 hover:text-gray-400 no-underline transition-colors">
              Engineering proof →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ UPCOMING EVENTS ═══════════ */}
      <div className="section-divider" />
      <section className="py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2">Discover</span>
              <h2 className="text-2xl font-bold text-white">Upcoming Events</h2>
              <p className="mt-1 text-sm text-gray-400">Don&apos;t miss out on these amazing experiences</p>
            </div>
            <Link href="/events" className="text-sm font-medium text-blue-400 hover:text-blue-300 no-underline transition-colors inline-flex items-center gap-1">
              View all <span>→</span>
            </Link>
          </div>
          {events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {events.map((e: any) => (
                <EventCard
                  key={e.id}
                  id={e.id}
                  name={e.name}
                  venue={e.venue}
                  category={e.category}
                  status={e.status}
                  startTime={e.startTime}
                  coverImageUrl={e.coverImageUrl}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <p className="text-gray-400 text-lg">No events yet</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon for upcoming events!</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <div className="section-divider" />
      <section className="py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-violet-400 mb-2">Process</span>
            <h2 className="text-2xl font-bold text-white">How SeatGuard Works</h2>
            <p className="mt-2 text-sm text-gray-400">Five simple steps to your perfect seat</p>
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className={`glass-card overflow-hidden p-6 min-h-[180px] text-center ${i < steps.length - 1 ? 'step-connector' : ''}`}>
                  <div className="mb-3 mx-auto h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-blue-500/30">
                    {i + 1}
                  </div>
                  <div className="mb-3 flex justify-center">
                    <Icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-white leading-snug">{step.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ WHY SEATGUARD ═══════════ */}
      <div className="section-divider" />
      <section className="py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-white">Why Choose SeatGuard</h2>
            <p className="mt-2 text-sm text-gray-400">Built for reliability, designed for you</p>
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="glass-card overflow-hidden p-6 min-h-[200px]">
                  <div className="mb-4 w-12 h-12 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-white leading-snug">{f.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
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
