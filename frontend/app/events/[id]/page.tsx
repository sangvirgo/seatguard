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
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventId) {
      getEvent(eventId).then(e => { if (e) setEvent(e); });
      getSeatMap(eventId).then(s => { if (s) setSeatMap(s); });
    }
  }, [eventId]);

  async function handleHold() {
    if (!isLoggedIn()) { setMsg('Please login first'); setMsgType('error'); return; }
    if (!selected) { setMsg('Select a seat first'); setMsgType('error'); return; }
    setLoading(true); setMsg('');
    const res = await holdSeat(eventId, selected);
    if (res.ok) {
      const bookingId = res.data.data?.id || res.data.id;
      localStorage.setItem('lastBookingId', bookingId);
      setMsg(`Seat held! Booking: ${bookingId.slice(0, 8)}...`);
      setMsgType('success');
      setSelected(null);
      getSeatMap(eventId).then(s => { if (s) setSeatMap(s); });
    } else if (res.status === 409) {
      setMsg('Seat already held by another user');
      setMsgType('error');
      getSeatMap(eventId).then(s => { if (s) setSeatMap(s); });
    } else {
      setMsg('Hold failed: ' + JSON.stringify(res.data));
      setMsgType('error');
    }
    setLoading(false);
  }

  if (!event) return <div className="py-20 text-center text-[var(--color-text-muted)]">Loading...</div>;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className="text-[var(--color-text-muted)]">📍 {event.venue} · {event.category}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${event.status === 'PUBLISHED' ? 'bg-emerald-950 text-emerald-400' : 'bg-purple-950 text-purple-400'}`}>
          {event.status}
        </span>
      </div>

      {msg && (
        <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${msgType === 'error' ? 'border-red-800 bg-red-950 text-red-300' : 'border-emerald-800 bg-emerald-950 text-emerald-300'}`}>
          {msg}
          {msg.includes('held') && (
            <button onClick={() => router.push('/tickets')} className="ml-4 text-[var(--color-accent)] underline">
              Go to Tickets →
            </button>
          )}
        </div>
      )}

      {/* Seat Map */}
      <div className="mb-8">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Seat Map</h2>
        {!seatMap ? (
          <div className="py-10 text-center text-[var(--color-text-muted)]">Loading seat map...</div>
        ) : seatMap.sections?.length === 0 ? (
          <div className="py-10 text-center text-[var(--color-text-muted)]">No sections</div>
        ) : (
          <div className="space-y-6">
            {seatMap.sections?.map((section: any) => (
              <div key={section.sectionId} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-semibold">{section.sectionName}</span>
                  <span className="text-sm font-medium text-[var(--color-accent)]">{(section.price || 0).toLocaleString()} VND</span>
                </div>
                <div className="space-y-2">
                  {groupByRow(section.seats || []).map(([row, seats]: [string, any[]]) => (
                    <div key={row} className="flex items-center gap-2">
                      <span className="w-8 text-center text-xs text-[var(--color-text-muted)]">{row}</span>
                      <div className="flex gap-1">
                        {seats.map((seat: any) => (
                          <button
                            key={seat.id}
                            onClick={() => seat.status === 'AVAILABLE' && setSelected(seat.id)}
                            disabled={seat.status !== 'AVAILABLE'}
                            title={`${seat.row}${seat.number} — ${seat.status}`}
                            className={`h-9 w-9 rounded-md text-xs font-bold transition-all
                              ${seat.status === 'AVAILABLE'
                                ? selected === seat.id
                                  ? 'bg-[var(--color-accent)] text-white ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg-card)]'
                                  : 'bg-emerald-600 text-white hover:scale-110'
                                : seat.status === 'HELD'
                                  ? 'bg-yellow-600/60 text-yellow-200 cursor-not-allowed'
                                  : 'bg-gray-700/40 text-gray-500 cursor-not-allowed'
                              }`}
                          >
                            {seat.number}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-4 text-xs text-[var(--color-text-muted)]">
                  <span>🟢 Available</span><span>🟡 Held</span><span>⚫ Sold</span>
                  {selected && <span className="text-[var(--color-accent)]">Selected: {selected.slice(0, 8)}...</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleHold} disabled={!selected || loading}
          className="rounded-xl bg-[var(--color-accent)] px-8 py-3 font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors">
          {loading ? 'Holding...' : selected ? '🎫 Hold Selected Seat' : 'Pick a Seat First'}
        </button>
      </div>
    </div>
  );
}

function groupByRow(seats: any[]): [string, any[]][] {
  const rows: Record<string, any[]> = {};
  for (const s of seats) { const r = s.row || '?'; if (!rows[r]) rows[r] = []; rows[r].push(s); }
  return Object.entries(rows).sort(([a], [b]) => a.localeCompare(b));
}
