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
      setMsg('Seat already held by another user — pick a different seat');
      setMsgType('error');
      getSeatMap(eventId).then(s => { if (s) setSeatMap(s); });
    } else {
      setMsg('Hold failed: ' + JSON.stringify(res.data));
      setMsgType('error');
    }
    setLoading(false);
  }

  if (!event) return <div className="py-20 text-center text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{event.name}</h1>
          <p className="mt-1 text-gray-400">📍 {event.venue} · {event.category}</p>
        </div>
        <span className={`badge-status ${event.status}`}>{event.status}</span>
      </div>

      {msg && (
        <div className={`mb-6 ${msgType === 'error' ? 'toast-error' : 'toast-success'}`}>
          {msg}
          {msg.includes('held') && (
            <button onClick={() => router.push('/tickets')} className="ml-4 text-blue-400 underline">
              Go to Tickets →
            </button>
          )}
        </div>
      )}

      {/* Stage */}
      <div className="mb-8 rounded-xl bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-pink-600/20 p-4 text-center">
        <span className="text-sm font-medium text-gray-300">🎤 STAGE</span>
      </div>

      {/* Seat Map */}
      <div className="mb-8">
        {!seatMap ? (
          <div className="py-10 text-center text-gray-500">Loading seat map...</div>
        ) : seatMap.sections?.length === 0 ? (
          <div className="py-10 text-center text-gray-500">No sections</div>
        ) : (
          <div className="space-y-6">
            {seatMap.sections?.map((section: any) => (
              <div key={section.sectionId} className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-semibold text-white">{section.sectionName}</span>
                  <span className="text-sm font-medium text-blue-400">{(section.price || 0).toLocaleString()} VND</span>
                </div>
                <div className="space-y-2">
                  {groupByRow(section.seats || []).map(([row, seats]: [string, any[]]) => (
                    <div key={row} className="flex items-center gap-2">
                      <span className="w-8 text-center text-xs text-gray-500">{row}</span>
                      <div className="flex gap-1">
                        {seats.map((seat: any) => (
                          <button
                            key={seat.id}
                            onClick={() => seat.status === 'AVAILABLE' && setSelected(seat.id)}
                            disabled={seat.status !== 'AVAILABLE'}
                            title={`${seat.row}${seat.number} — ${seat.status}`}
                            className={`seat ${seat.status} ${selected === seat.id ? 'selected' : ''}`}
                          >
                            {seat.number}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-4 text-xs text-gray-500">
                  <span>🟢 Available</span><span>🟡 Held</span><span>⚫ Sold</span>
                  {selected && <span className="text-blue-400">Selected: {selected.slice(0, 8)}...</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleHold} disabled={!selected || loading}
          className="btn-glow disabled:opacity-50">
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
