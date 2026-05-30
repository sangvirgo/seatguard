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
    } else { setMsg('Payment failed'); setMsgType('error'); }
  }

  async function handleCheckIn(id: string) {
    setMsg('');
    const res = await checkInTicket(id);
    if (res.ok) { setMsg('Checked in!'); setMsgType('success'); loadTickets(); }
    else { setMsg('Check-in failed: ' + JSON.stringify(res.data)); setMsgType('error'); }
  }

  return (
    <div>
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Tickets</h1>
          <p className="mt-1 text-sm text-gray-400">View and manage your event tickets</p>
        </div>
        <button onClick={loadTickets} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5 transition-all">
          Refresh
        </button>
      </div>

      {msg && <div className={`mb-6 ${msgType === 'error' ? 'toast-error' : 'toast-success'}`}>{msg}</div>}

      {bookingId && (
        <div className="glass-card mb-6 border-amber-500/20 p-6">
          <h3 className="mb-2 font-semibold text-amber-300">⏳ Pending Payment</h3>
          <p className="mb-4 text-sm text-gray-400">Booking: <code className="rounded bg-white/5 px-2 py-0.5 text-xs">{bookingId}</code></p>
          <button onClick={handlePay} className="btn-glow !bg-gradient-to-r !from-emerald-600 !to-emerald-500">
            💳 Pay Now
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-gray-500">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-blue-500"></div>
          Loading...
        </div>
      ) : tickets.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <div className="mb-4 text-5xl">🎫</div>
          <p className="mb-2 text-lg font-medium text-white">No tickets yet</p>
          <p className="mb-6 text-gray-400">Browse events, hold a seat, and pay to get your ticket</p>
          <a href="/events" className="btn-glow no-underline">Browse Events →</a>
        </div>
      ) : (
        <div className="space-y-6">
          {tickets.map((t: any) => (
            <div key={t.id} className="ticket-card">
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-white">🎫 Ticket</h3>
                <div className="my-4 font-mono text-3xl font-bold tracking-[0.3em] text-blue-400">{t.checkInCode || 'N/A'}</div>
                <p className="text-sm text-gray-400">{t.seatInfo || `Seat ${t.seatId?.slice(0, 8)}`}</p>
                <div className="my-4">
                  <span className={`badge-status ${t.status}`}>{t.status}</span>
                </div>
                {t.status === 'VALID' && (
                  <button onClick={() => handleCheckIn(t.id)} className="btn-glow">✅ Check In</button>
                )}
                {t.status === 'USED' && <p className="text-amber-400">✅ Already checked in</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
