'use client';

import { useEffect, useState } from 'react';
import { listEvents, createEvent, addSection, generateSeats, publishEvent, uploadEventImage, isLoggedIn, getProfile } from '../../lib/api';
import EventCard from '../../components/EventCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';

const categories = ['All', 'Concert', 'Workshop', 'Sports', 'Theater'];

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => {
    loadEvents();
    if (isLoggedIn()) {
      getProfile().then(profile => {
        if (profile?.role === 'ADMIN') setIsAdmin(true);
      }).catch(() => {});
    }
  }, []);

  async function loadEvents() {
    setLoading(true);
    setError('');
    try {
      setEvents(await listEvents());
    } catch {
      setError('Failed to load events. Please try again.');
    }
    setLoading(false);
  }

  async function handleCreateDemo() {
    if (!isLoggedIn()) {
      setMsg('Please login first to create a demo event.');
      return;
    }
    setCreating(true);
    setMsg('');
    try {
      const res = await createEvent('Concert Demo 2026', 'National Stadium, HCMC', 'CONCERT');
      if (!res.ok) { setMsg('Failed to create event.'); setCreating(false); return; }
      const id = res.data.data?.id || res.data.id;
      await addSection(id, 'VIP', 2500000, 50);
      await addSection(id, 'General Admission', 500000, 200);
      await generateSeats(id, 5, 10);
      await publishEvent(id);
      setMsg('Demo event created and published!');
      loadEvents();
    } catch (e: any) {
      setMsg('Error: ' + e.message);
    }
    setCreating(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedEventId) return;
    setUploadingImage(true);
    setMsg('');
    try {
      const res = await uploadEventImage(selectedEventId, file);
      if (res.ok) {
        setMsg('Image uploaded successfully!');
        loadEvents();
      } else {
        setMsg('Upload failed: ' + (res.data?.message || 'Unknown error'));
      }
    } catch (err: any) {
      setMsg('Upload error: ' + err.message);
    }
    setUploadingImage(false);
  }

  const filtered = events.filter(e => {
    const matchSearch = !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.venue?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'All' || e.category?.toUpperCase() === activeCategory.toUpperCase();
    return matchSearch && matchCategory;
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative mb-12 pb-8 pt-4 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-4xl font-bold text-white mb-3">Explore Events</h1>
          <p className="text-gray-400 mb-8">Find your next unforgettable experience</p>
          {/* Search */}
          <div className="mx-auto max-w-xl">
            <input
              type="text"
              placeholder="Search events by name or venue..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full !py-3 !px-5 !text-base"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Category Chips */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg'
                  : 'border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Create Demo Button */}
        <div className="mb-8 flex flex-wrap justify-end gap-3">
          <button
            onClick={handleCreateDemo}
            disabled={creating}
            className="btn-glow !py-2.5 !px-6 text-sm disabled:opacity-50"
          >
            {creating ? 'Creating...' : '+ Create Demo Event'}
          </button>
        </div>

        {/* Admin Image Upload */}
        {isAdmin && events.length > 0 && (
          <div className="mb-8 glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">📸 Upload Event Image (Admin)</h3>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
                className="!py-2 !px-3 !text-sm"
              >
                <option value="">Select event...</option>
                {events.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
              <label className={`btn-glow !py-2 !px-4 text-sm cursor-pointer ${(!selectedEventId || uploadingImage) ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploadingImage ? 'Uploading...' : 'Choose Image'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={!selectedEventId || uploadingImage}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">JPEG, PNG, or WebP. Max 5MB.</p>
          </div>
        )}

        {/* Message */}
        {msg && (
          <div className={`mb-6 ${msg.includes('Error') || msg.includes('Failed') || msg.includes('login') ? 'toast-error' : 'toast-success'}`}>
            {msg}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingState message="Loading events..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadEvents} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No events found"
            description={search || activeCategory !== 'All' ? 'Try adjusting your search or filters' : 'Click "Create Demo Event" to get started'}
          />
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e: any) => (
              <EventCard
                key={e.id}
                id={e.id}
                name={e.name}
                venue={e.venue}
                category={e.category}
                status={e.status}
                startTime={e.startTime}
                coverImageUrl={e.coverImageUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
