'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listEvents, createEvent, addSection, generateSeats, publishEvent, isLoggedIn } from '../../lib/api';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    setLoading(true);
    try { setEvents(await listEvents()); } catch { setMsg('Failed to load events'); }
    setLoading(false);
  }

  async function handleCreateDemo() {
    if (!isLoggedIn()) { setMsg('Please login first'); return; }
    setCreating(true); setMsg('');
    try {
      const res = await createEvent('Concert Demo 2026', 'National Stadium, HCMC', 'CONCERT');
      if (!res.ok) { setMsg('Create failed'); setCreating(false); return; }
      const id = res.data.data?.id || res.data.id;
      await addSection(id, 'VIP', 2500000, 50);
      await addSection(id, 'General Admission', 500000, 200);
      await generateSeats(id, 5, 10);
      await publishEvent(id);
      setMsg('Demo event created and published!');
      loadEvents();
    } catch (e: any) { setMsg('Error: ' + e.message); }
    setCreating(false);
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <button onClick={handleCreateDemo} disabled={creating}
          className="rounded-lg bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors">
          {creating ? 'Creating...' : '+ Create Demo Event'}
        </button>
      </div>

      {msg && (
        <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${msg.includes('Error') || msg.includes('Failed') ? 'border-red-800 bg-red-950 text-red-300' : 'border-emerald-800 bg-emerald-950 text-emerald-300'}`}>
          {msg}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-[var(--color-text-muted)]">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center">
          <p className="mb-2 text-lg">No events yet</p>
          <p className="text-[var(--color-text-muted)]">Click &quot;Create Demo Event&quot; to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e: any) => (
            <Link key={e.id} href={`/events/${e.id}`} className="group no-underline">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 transition-all hover:border-[#333] hover:bg-[var(--color-bg-hover)]">
                <div className="mb-3 flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.status === 'PUBLISHED' ? 'bg-emerald-950 text-emerald-400' : 'bg-purple-950 text-purple-400'}`}>
                    {e.status}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{e.category}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">{e.name}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">📍 {e.venue}</p>
                {e.startTime && (
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                    {new Date(e.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
