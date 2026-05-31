'use client';

import { useEffect, useState } from 'react';
import { getMyTickets, checkInTicket, isLoggedIn, payBooking } from '../../lib/api';
import TicketCard from '../../components/TicketCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import { useRouter } from 'next/navigation';

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [lookupType, setLookupType] = useState<'bookingId' | 'ticketId' | 'checkInCode'>('bookingId');
  const [lookupValue, setLookupValue] = useState('');

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
    setPaying(true);
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
      setMsg('Payment failed. Please try again.');
      setMsgType('error');
    }
    setPaying(false);
  }

  async function handleCheckIn(id: string) {
    setMsg('');
    const res = await checkInTicket(id);
    if (res.ok) {
      setMsg('Checked in successfully!');
      setMsgType('success');
      loadTickets();
    } else {
      setMsg('Check-in failed: ' + JSON.stringify(res.data));
      setMsgType('error');
    }
  }

  function handleLookup() {
    if (!lookupValue.trim()) return;
    if (lookupType === 'bookingId') {
      router.push(`/tickets?bookingId=${lookupValue}`);
    } else if (lookupType === 'ticketId') {
      router.push(`/tickets?ticketId=${lookupValue}`);
    } else {
      router.push(`/tickets?checkInCode=${lookupValue}`);
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative mb-10 pb-6 pt-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">My Tickets</h1>
              <p className="mt-1 text-sm text-gray-400">View and manage your event tickets</p>
            </div>
            <button
              onClick={loadTickets}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5 transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Messages */}
        {msg && (
          <div className={`mb-6 ${msgType === 'error' ? 'toast-error' : 'toast-success'}`}>
            {msg}
          </div>
        )}

        {/* Ticket Lookup */}
        <div className="glass-card p-6 mb-8">
          <h3 className="text-sm font-semibold text-white mb-3">🔍 Look Up Ticket</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={lookupType}
              onChange={e => setLookupType(e.target.value as any)}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-300"
            >
              <option value="bookingId">Booking ID</option>
              <option value="ticketId">Ticket ID</option>
              <option value="checkInCode">Check-in Code</option>
            </select>
            <input
              type="text"
              placeholder={`Enter ${lookupType}...`}
              value={lookupValue}
              onChange={e => setLookupValue(e.target.value)}
              className="flex-1"
            />
            <button onClick={handleLookup} className="btn-glow !py-2 text-sm">
              Search
            </button>
          </div>
        </div>

        {/* Pending Payment */}
        {bookingId && (
          <div className="glass-card mb-8 border-amber-500/20 p-6">
            <h3 className="mb-2 font-semibold text-amber-300">⏳ Pending Payment</h3>
            <p className="mb-4 text-sm text-gray-400">
              Booking: <code className="rounded bg-white/5 px-2 py-0.5 text-xs">{bookingId}</code>
            </p>
            <button
              onClick={handlePay}
              disabled={paying}
              className="btn-glow !bg-gradient-to-r !from-emerald-600 !to-emerald-500 disabled:opacity-50"
            >
              {paying ? 'Processing...' : '💳 Pay Now'}
            </button>
          </div>
        )}

        {/* Tickets */}
        {loading ? (
          <LoadingState message="Loading tickets..." />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon="🎫"
            title="No tickets yet"
            description="Browse events, hold a seat, and pay to get your ticket"
            actionLabel="Browse Events →"
            actionHref="/events"
          />
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
            {tickets.map((t: any) => (
              <TicketCard
                key={t.id}
                id={t.id}
                status={t.status}
                checkInCode={t.checkInCode}
                seatInfo={t.seatInfo}
                seatId={t.seatId}
                eventName={t.eventName}
                onCheckIn={handleCheckIn}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
