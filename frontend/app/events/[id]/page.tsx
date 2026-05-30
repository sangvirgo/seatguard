'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEvent, getSeatMap, holdSeat, isLoggedIn } from '../../../lib/api';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<any>(null);
  const [seatMap, setSeatMap] = useState<any>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventId) {
      getEvent(eventId).then(e => { if (e) setEvent(e); });
      getSeatMap(eventId).then(s => { if (s) setSeatMap(s); });
    }
  }, [eventId]);

  async function handleHold() {
    if (!isLoggedIn()) { setMsg('Please login first'); setMsgType('error'); return; }
    if (!selectedSeat) { setMsg('Select a seat first'); setMsgType('error'); return; }

    setLoading(true);
    setMsg('');
    try {
      const res = await holdSeat(eventId, selectedSeat);
      if (res.ok) {
        const bookingId = res.data.data?.id || res.data.id;
        setMsg(`Seat held! Booking ID: ${bookingId}`);
        setMsgType('success');
        // Store bookingId for payment
        localStorage.setItem('lastBookingId', bookingId);
        // Refresh seat map
        const updated = await getSeatMap(eventId);
        if (updated) setSeatMap(updated);
      } else if (res.status === 409) {
        setMsg('Seat already held by another user. Pick a different seat.');
        setMsgType('error');
        const updated = await getSeatMap(eventId);
        if (updated) setSeatMap(updated);
      } else {
        setMsg('Hold failed: ' + JSON.stringify(res.data));
        setMsgType('error');
      }
    } catch (e: any) {
      setMsg('Error: ' + e.message);
      setMsgType('error');
    }
    setLoading(false);
  }

  if (!event) return <div className="empty-state">Loading event...</div>;

  return (
    <div>
      <div className="header-row">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{event.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📍 {event.venue} · {event.category}</p>
        </div>
        <span className={`badge ${event.status}`}>{event.status}</span>
      </div>

      {msg && <div className={`msg msg-${msgType}`}>{msg}</div>}

      {/* Seat Map */}
      <section style={{ marginTop: 24 }}>
        <h2 className="section-title">Seat Map</h2>
        {!seatMap ? (
          <div className="empty-state">Loading seat map...</div>
        ) : seatMap.sections?.length === 0 ? (
          <div className="empty-state">No sections/seats yet</div>
        ) : (
          <div>
            {seatMap.sections?.map((section: any) => (
              <div key={section.sectionId} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <strong>{section.sectionName}</strong>
                  <span style={{ color: 'var(--accent)' }}>
                    {(section.price || 0).toLocaleString()} VND
                  </span>
                </div>
                <div className="seat-map">
                  {groupSeatsByRow(section.seats || []).map(([row, seats]: [string, any[]]) => (
                    <div key={row} className="seat-row">
                      <span className="row-label">{row}</span>
                      {seats.map((seat: any) => (
                        <button
                          key={seat.id}
                          className={`seat ${seat.status} ${selectedSeat === seat.id ? 'selected' : ''}`}
                          onClick={() => seat.status === 'AVAILABLE' && setSelectedSeat(seat.id)}
                          title={`${seat.row}${seat.number} - ${seat.status}`}
                          disabled={seat.status !== 'AVAILABLE'}
                        >
                          {seat.number}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>🟢 Available</span>
                  <span>🟡 Held</span>
                  <span>⚫ Sold</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <section style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button
          className="btn btn-primary"
          onClick={handleHold}
          disabled={!selectedSeat || loading}
        >
          {loading ? 'Holding...' : `Hold Selected Seat${selectedSeat ? '' : ' (pick one)'}`}
        </button>
        {msg.includes('held') && (
          <button
            className="btn btn-success"
            onClick={() => router.push('/tickets')}
          >
            Go to Tickets →
          </button>
        )}
      </section>
    </div>
  );
}

function groupSeatsByRow(seats: any[]): [string, any[]][] {
  const rows: Record<string, any[]> = {};
  for (const seat of seats) {
    const row = seat.row || '?';
    if (!rows[row]) rows[row] = [];
    rows[row].push(seat);
  }
  return Object.entries(rows).sort(([a], [b]) => a.localeCompare(b));
}
