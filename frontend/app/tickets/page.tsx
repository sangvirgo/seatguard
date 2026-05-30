'use client';

import { useEffect, useState } from 'react';
import { getMyTickets, checkInTicket, isLoggedIn, payBooking, getUserId } from '../../lib/api';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(true);
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLastBookingId(localStorage.getItem('lastBookingId'));
    }
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch (e) { /* ignore */ }
    setLoading(false);
  }

  async function handlePay() {
    if (!lastBookingId) return;
    setMsg('');
    try {
      const res = await payBooking(lastBookingId);
      if (res.ok) {
        setMsg('Payment confirmed! Ticket should be issued shortly via Kafka...');
        setMsgType('success');
        localStorage.removeItem('lastBookingId');
        setLastBookingId(null);
        // Wait for Kafka propagation then reload
        setTimeout(loadTickets, 3000);
        setTimeout(loadTickets, 6000);
      } else {
        setMsg('Payment failed: ' + JSON.stringify(res.data));
        setMsgType('error');
      }
    } catch (e: any) {
      setMsg('Error: ' + e.message);
      setMsgType('error');
    }
  }

  async function handleCheckIn(ticketId: string) {
    setMsg('');
    try {
      const res = await checkInTicket(ticketId);
      if (res.ok) {
        setMsg('Check-in successful!');
        setMsgType('success');
        loadTickets();
      } else {
        setMsg('Check-in failed: ' + JSON.stringify(res.data));
        setMsgType('error');
      }
    } catch (e: any) {
      setMsg('Error: ' + e.message);
      setMsgType('error');
    }
  }

  return (
    <div>
      <div className="header-row">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Tickets</h1>
        <button className="btn btn-outline btn-sm" onClick={loadTickets}>Refresh</button>
      </div>

      {msg && <div className={`msg msg-${msgType}`}>{msg}</div>}

      {/* Pending Payment */}
      {lastBookingId && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--warning)' }}>
          <h3 style={{ marginBottom: 8 }}>⏳ Pending Payment</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            Booking ID: <code>{lastBookingId}</code>
          </p>
          <button className="btn btn-success" onClick={handlePay}>
            💳 Pay Now
          </button>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '1.2rem', marginBottom: 12 }}>No tickets yet</p>
          <p>Browse events, hold a seat, and pay to get your ticket.</p>
          <a href="/events" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Events →</a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tickets.map((ticket: any) => (
            <div key={ticket.id} className="ticket">
              <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>🎫 Ticket</h3>
              <div className="code">{ticket.checkInCode || 'N/A'}</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {ticket.seatInfo || `Seat ${ticket.seatId?.slice(0, 8)}`}
              </p>
              <div style={{ margin: '16px 0' }}>
                <span className={`status-badge ${ticket.status}`}>{ticket.status}</span>
              </div>
              {ticket.status === 'VALID' && (
                <button className="btn btn-primary" onClick={() => handleCheckIn(ticket.id)}>
                  ✅ Check In
                </button>
              )}
              {ticket.status === 'USED' && (
                <p style={{ color: 'var(--warning)', fontSize: '0.9rem' }}>
                  ✅ Already checked in at {ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleString() : 'N/A'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
