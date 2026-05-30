'use client';

import { useEffect, useState } from 'react';
import { getMyTickets, checkInTicket, isLoggedIn, payBooking } from '../../lib/api';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') setBookingId(localStorage.getItem('lastBookingId'));
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try { setTickets(await getMyTickets()); } catch {}
    setLoading(false);
  }

  async function handlePay() {
    if (!bookingId) return;
    setMsg('');
    const res = await payBooking(bookingId);
    if (res.ok) {
      setMsg('Payment confirmed! Ticket issuing via Kafka...');
      setMsgType('success');
      localStorage.removeItem('lastBookingId');
      setBookingId(null);
      setTimeout(loadTickets, 3000);
      setTimeout(loadTickets, 6000);
    } else {
      setMsg('Payment failed');
      setMsgType('error');
    }
  }

  async function handleCheckIn(id: string) {
    setMsg('');
    const res = await checkInTicket(id);
    if (res.ok) { setMsg('Checked in!'); setMsgType('success'); loadTickets(); }
    else { setMsg('Check-in failed'); setMsgType('error'); }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Tickets</h1>
        <button onClick={loadTickets} className="rounded-lg border border-[var(--color-border)] px-4 py-1.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors">
          Refresh
        </button>
      </div>

      {msg && (
        <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${msgType === 'error' ? 'border-red-800 bg-red-950 text-red-300' : 'border-emerald-800 bg-emerald-950 text-emerald-300'}`}>
          {msg}
        </div>
      )}

      {/* Pending Payment */}
      {bookingId && (
        <div className="mb-6 rounded-xl border border-yellow-800 bg-yellow-950/30 p-5">
          <h3 className="mb-2 font-semibold text-yellow-300">⏳ Pending Payment</h3>
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">Booking: <code className="text-xs">{bookingId}</code></p>
          <button onClick={handlePay} className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
            💳 Pay Now
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-[var(--color-text-muted)]">Loading...</div>
      ) : tickets.length === 0 ? (
        <div className="py-20 text-center">
          <p className="mb-2 text-lg">No tickets yet</p>
          <p className="mb-6 text-[var(--color-text-muted)]">Browse events, hold a seat, and pay to get your ticket</p>
          <a href="/events" className="rounded-xl bg-[var(--color-accent)] px-6 py-3 font-semibold text-white no-underline hover:bg-[var(--color-accent-hover)] transition-colors">
            Browse Events →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t: any) => (
            <div key={t.id} className="rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center">
              <h3 className="text-lg font-semibold">🎫 Ticket</h3>
              <div className="my-3 font-mono text-2xl font-bold tracking-widest text-[var(--color-accent)]">{t.checkInCode || 'N/A'}</div>
              <p className="text-sm text-[var(--color-text-muted)]">{t.seatInfo || `Seat ${t.seatId?.slice(0, 8)}`}</p>
              <div className="my-4">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${t.status === 'VALID' ? 'bg-emerald-950 text-emerald-400' : 'bg-yellow-950 text-yellow-400'}`}>
                  {t.status}
                </span>
              </div>
              {t.status === 'VALID' && (
                <button onClick={() => handleCheckIn(t.id)} className="rounded-lg bg-[var(--color-accent)] px-6 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] transition-colors">
                  ✅ Check In
                </button>
              )}
              {t.status === 'USED' && (
                <p className="text-sm text-yellow-400">✅ Checked in</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
