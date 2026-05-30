'use client';

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
    try {
      const data = await listEvents();
      setEvents(data);
    } catch (e) { setMsg('Failed to load events'); }
    setLoading(false);
  }

  async function handleCreateDemo() {
    if (!isLoggedIn()) { setMsg('Please login first'); return; }
    setCreating(true);
    setMsg('');
    try {
      // Create event
      const res = await createEvent('Concert Demo 2026', 'National Stadium, HCMC', 'CONCERT');
      if (!res.ok) { setMsg('Create failed: ' + JSON.stringify(res.data)); setCreating(false); return; }
      const eventId = res.data.data?.id || res.data.id;

      // Add VIP section
      await addSection(eventId, 'VIP', 2500000, 50);
      // Add GA section
      await addSection(eventId, 'General Admission', 500000, 200);

      // Generate seats
      await generateSeats(eventId, 5, 10);

      // Publish
      await publishEvent(eventId);

      setMsg('Demo event created and published!');
      loadEvents();
    } catch (e: any) {
      setMsg('Error: ' + e.message);
    }
    setCreating(false);
  }

  return (
    <div>
      <div className="header-row">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Events</h1>
        <button className="btn btn-primary btn-sm" onClick={handleCreateDemo} disabled={creating}>
          {creating ? 'Creating...' : '+ Create Demo Event'}
        </button>
      </div>

      {msg && <div className={`msg ${msg.includes('Error') || msg.includes('Failed') ? 'msg-error' : 'msg-success'}`}>{msg}</div>}

      {loading ? (
        <div className="empty-state">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontSize: '1.2rem', marginBottom: 12 }}>No events yet</p>
          <p>Click &quot;Create Demo Event&quot; to get started</p>
        </div>
      ) : (
        <div className="card-grid">
          {events.map((event: any) => (
            <a key={event.id} href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className={`badge ${event.status}`}>{event.status}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{event.category}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>{event.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {event.venue}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  {event.startTime ? new Date(event.startTime).toLocaleDateString() : ''}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
