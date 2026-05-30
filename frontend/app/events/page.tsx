'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listEvents, createEvent, addSection, generateSeats, publishEvent, isLoggedIn } from '../../lib/api';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    setLoading(true);
    try { setEvents(await listEvents()); } catch { setMsg('Failed to load events'); setMsgType('error'); }
    setLoading(false);
  }

  async function handleCreateDemo() {
    if (!isLoggedIn()) { setMsg('Please login first'); setMsgType('error'); return; }
    setCreating(true); setMsg('');
    try {
      const res = await createEvent('Concert Demo 2026', 'National Stadium, HCMC', 'CONCERT');
      if (!res.ok) { setMsg('Create failed'); setMsgType('error'); setCreating(false); return; }
      const id = res.data.data?.id || res.data.id;
      await addSection(id, 'VIP', 2500000, 50);
      await addSection(id, 'General Admission', 500000, 200);
      await generateSeats(id, 5, 10);
      await publishEvent(id);
      setMsg('Demo event created and published!');
      setMsgType('success');
      loadEvents();
    } catch (e: any) { setMsg('Error: ' + e.message); setMsgType('error'); }
    setCreating(false);
  }

  return (
    <div>
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Events</h1>
          <p className="mt-1 text-sm text-gray-400">Browse and book tickets for upcoming events</p>
        </div>
        <button onClick={handleCreateDemo} disabled={creating}
          className="btn-glow !py-2.5 !px-6 text-sm disabled:opacity-50">
          {creating ? 'Creating...' : '+ Create Demo Event'}
        </button>
      </div>

      {msg && <div className={`mb-6 ${msgType === 'error' ? 'toast-error' : 'toast-success'}`}>{msg}</div>}

      {loading ? (
        <div className="py-20 text-center text-gray-500">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-blue-500"></div>
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <div className="mb-4 text-5xl">🎪</div>
          <p className="mb-2 text-lg font-medium text-white">No events yet</p>
          <p className="text-gray-400">Click &quot;Create Demo Event&quot; to get started</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e: any) => (
            <Link key={e.id} href={`/events/${e.id}`} className="group no-underline">
              <div className="glass-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className={`badge-status ${e.status}`}>{e.status}</span>
                  <span className="text-xs text-gray-500">{e.category}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{e.name}</h3>
                <p className="text-sm text-gray-400">📍 {e.venue}</p>
                {e.startTime && (
                  <p className="mt-3 text-xs text-gray-500">
                    {new Date(e.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  View details →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
