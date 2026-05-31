'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  isLoggedIn,
  getProfile,
  listEvents,
  createEvent,
  addSection,
  generateSeats,
  publishEvent,
  uploadEventImage,
} from '../../lib/api';

const CATEGORIES = ['CONCERT', 'WORKSHOP', 'SPORTS', 'THEATER'];

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [authState, setAuthState] = useState<'loading' | 'guest' | 'forbidden' | 'admin'>('loading');
  const [events, setEvents] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');

  // Create event form
  const [formName, setFormName] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formCategory, setFormCategory] = useState('CONCERT');
  const [formDesc, setFormDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // Post-create workflow
  const [workflowEvent, setWorkflowEvent] = useState<any>(null);
  const [sectionName, setSectionName] = useState('VIP');
  const [sectionPrice, setSectionPrice] = useState('1000000');
  const [sectionCapacity, setSectionCapacity] = useState('50');
  const [rows, setRows] = useState('5');
  const [seatsPerRow, setSeatsPerRow] = useState('10');
  const [workflowStep, setWorkflowStep] = useState(0); // 0=idle, 1=section, 2=seats, 3=publish, 4=done
  const [workflowLoading, setWorkflowLoading] = useState(false);

  // Image upload
  const [uploadEventId, setUploadEventId] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      setAuthState('guest');
      return;
    }
    getProfile()
      .then((u) => {
        if (!u) { setAuthState('guest'); return; }
        setUser(u);
        if (u.role === 'ADMIN') {
          setAuthState('admin');
          loadEvents();
        } else {
          setAuthState('forbidden');
        }
      })
      .catch(() => setAuthState('guest'));
  }, []);

  async function loadEvents() {
    try {
      setEvents(await listEvents());
    } catch {}
  }

  function showMsg(text: string, type: 'success' | 'error' = 'success') {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  }

  // ── Create Event ──────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName || !formVenue) return;
    setCreating(true);
    try {
      const res = await createEvent(formName, formVenue, formCategory);
      if (!res.ok) {
        showMsg('Failed to create event: ' + (res.data?.message || 'Unknown'), 'error');
        setCreating(false);
        return;
      }
      const id = res.data.data?.id || res.data.id;
      const evt = { id, name: formName, venue: formVenue, category: formCategory, status: 'DRAFT' };
      setWorkflowEvent(evt);
      setWorkflowStep(1);
      showMsg('Event created! Now add a section.');
      setFormName('');
      setFormVenue('');
      setFormDesc('');
      loadEvents();
    } catch (err: any) {
      showMsg('Error: ' + err.message, 'error');
    }
    setCreating(false);
  }

  // ── Workflow: Add Section ─────────────────────────────
  async function handleAddSection() {
    if (!workflowEvent) return;
    setWorkflowLoading(true);
    try {
      const res = await addSection(workflowEvent.id, sectionName, Number(sectionPrice), Number(sectionCapacity));
      if (res.ok) {
        showMsg('Section added! Now generate seats.');
        setWorkflowStep(2);
      } else {
        showMsg('Failed to add section: ' + (res.data?.message || ''), 'error');
      }
    } catch (err: any) {
      showMsg('Error: ' + err.message, 'error');
    }
    setWorkflowLoading(false);
  }

  // ── Workflow: Generate Seats ──────────────────────────
  async function handleGenerateSeats() {
    if (!workflowEvent) return;
    setWorkflowLoading(true);
    try {
      const res = await generateSeats(workflowEvent.id, Number(rows), Number(seatsPerRow));
      if (res.ok) {
        showMsg('Seats generated! Ready to publish.');
        setWorkflowStep(3);
      } else {
        showMsg('Failed to generate seats: ' + (res.data?.message || ''), 'error');
      }
    } catch (err: any) {
      showMsg('Error: ' + err.message, 'error');
    }
    setWorkflowLoading(false);
  }

  // ── Workflow: Publish ─────────────────────────────────
  async function handlePublish() {
    if (!workflowEvent) return;
    setWorkflowLoading(true);
    try {
      const res = await publishEvent(workflowEvent.id);
      if (res.ok) {
        showMsg('Event published! 🎉');
        setWorkflowStep(4);
        loadEvents();
      } else {
        showMsg('Failed to publish: ' + (res.data?.message || ''), 'error');
      }
    } catch (err: any) {
      showMsg('Error: ' + err.message, 'error');
    }
    setWorkflowLoading(false);
  }

  // ── Image Upload ──────────────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !uploadEventId) return;
    setUploading(true);
    try {
      const res = await uploadEventImage(uploadEventId, file);
      if (res.ok) {
        showMsg('Image uploaded!');
        loadEvents();
      } else {
        showMsg('Upload failed: ' + (res.data?.message || ''), 'error');
      }
    } catch (err: any) {
      showMsg('Upload error: ' + err.message, 'error');
    }
    setUploading(false);
  }

  // ── Auth gates ────────────────────────────────────────
  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (authState === 'guest') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-2">Authentication Required</h1>
          <p className="text-gray-400 mb-6">Please login to access the admin panel.</p>
          <Link href="/login" className="btn-glow">Go to Login</Link>
        </div>
      </div>
    );
  }

  if (authState === 'forbidden') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center max-w-md">
          <div className="text-5xl mb-4">⛔</div>
          <h1 className="text-3xl font-bold text-white mb-2">403 — Access Denied</h1>
          <p className="text-gray-400 mb-6">You don&apos;t have permission to view this page.</p>
          <Link href="/" className="btn-glow">Back to Home</Link>
        </div>
      </div>
    );
  }

  // ── Admin Dashboard ───────────────────────────────────
  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <section className="relative pt-6 pb-10 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="container-main relative z-10">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage events, sections, and seats</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Toast */}
        {msg && (
          <div className={`mb-6 ${msgType === 'error' ? 'toast-error' : 'toast-success'}`}>
            {msg}
          </div>
        )}

        {/* ── A. Overview Cards ──────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="metric-card">
            <div className="text-2xl mb-1">👤</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Admin</div>
            <div className="text-sm text-white font-medium truncate">{user?.email}</div>
            <div className="text-xs text-violet-400 mt-1">{user?.role}</div>
          </div>
          <div className="metric-card">
            <div className="text-2xl mb-1">🎪</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Events</div>
            <div className="text-3xl font-bold text-white">{events.length}</div>
          </div>
          <div className="metric-card">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Published</div>
            <div className="text-3xl font-bold text-white">
              {events.filter((e: any) => e.status === 'PUBLISHED').length}
            </div>
          </div>
          <Link href="/proof" className="metric-card no-underline group">
            <div className="text-2xl mb-1">📊</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Evidence</div>
            <div className="text-sm text-blue-400 group-hover:text-blue-300 transition-colors">
              Engineering Proof →
            </div>
          </Link>
        </div>

        {/* ── B. Event Management ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Left: Create Event + Workflow */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">➕ Create Event</h2>
            {workflowStep === 0 ? (
              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Event name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Venue"
                  value={formVenue}
                  onChange={(e) => setFormVenue(e.target.value)}
                  required
                />
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
                <button type="submit" disabled={creating} className="btn-glow !py-2.5 mt-1">
                  {creating ? 'Creating...' : 'Create Event'}
                </button>
              </form>
            ) : (
              /* Workflow stepper */
              <div>
                <div className="text-sm text-gray-400 mb-3">
                  Event: <span className="text-white font-medium">{workflowEvent?.name}</span>
                </div>

                {/* Step indicators */}
                <div className="flex items-center gap-2 mb-5">
                  {['Section', 'Seats', 'Publish', 'Done'].map((label, i) => (
                    <div key={label} className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          i + 1 <= workflowStep
                            ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white'
                            : 'bg-white/5 text-gray-500'
                        }`}
                      >
                        {i + 1 < workflowStep ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs ${i + 1 <= workflowStep ? 'text-white' : 'text-gray-500'}`}>
                        {label}
                      </span>
                      {i < 3 && <div className="w-4 h-px bg-white/10" />}
                    </div>
                  ))}
                </div>

                {/* Step 1: Add Section */}
                {workflowStep === 1 && (
                  <div className="flex flex-col gap-3">
                    <input type="text" placeholder="Section name" value={sectionName} onChange={(e) => setSectionName(e.target.value)} />
                    <input type="number" placeholder="Price" value={sectionPrice} onChange={(e) => setSectionPrice(e.target.value)} />
                    <input type="number" placeholder="Capacity" value={sectionCapacity} onChange={(e) => setSectionCapacity(e.target.value)} />
                    <button onClick={handleAddSection} disabled={workflowLoading} className="btn-glow !py-2.5">
                      {workflowLoading ? 'Adding...' : 'Add Section'}
                    </button>
                  </div>
                )}

                {/* Step 2: Generate Seats */}
                {workflowStep === 2 && (
                  <div className="flex flex-col gap-3">
                    <input type="number" placeholder="Rows" value={rows} onChange={(e) => setRows(e.target.value)} />
                    <input type="number" placeholder="Seats per row" value={seatsPerRow} onChange={(e) => setSeatsPerRow(e.target.value)} />
                    <button onClick={handleGenerateSeats} disabled={workflowLoading} className="btn-glow !py-2.5">
                      {workflowLoading ? 'Generating...' : 'Generate Seats'}
                    </button>
                  </div>
                )}

                {/* Step 3: Publish */}
                {workflowStep === 3 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-gray-400">Everything is ready. Publish to make the event live.</p>
                    <button onClick={handlePublish} disabled={workflowLoading} className="btn-glow !py-2.5">
                      {workflowLoading ? 'Publishing...' : '🚀 Publish Event'}
                    </button>
                  </div>
                )}

                {/* Step 4: Done */}
                {workflowStep === 4 && (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-white font-medium mb-3">Event is live!</p>
                    <button
                      onClick={() => { setWorkflowStep(0); setWorkflowEvent(null); }}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Create another event
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Image Upload */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">📸 Upload Event Image</h2>
            {events.length === 0 ? (
              <p className="text-sm text-gray-500">No events yet. Create one first.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <select value={uploadEventId} onChange={(e) => setUploadEventId(e.target.value)}>
                  <option value="">Select event...</option>
                  {events.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                <label
                  className={`btn-glow !py-2.5 text-center cursor-pointer ${
                    !uploadEventId || uploading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {uploading ? 'Uploading...' : 'Choose Image'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={!uploadEventId || uploading}
                  />
                </label>
                <p className="text-xs text-gray-500">JPEG, PNG, or WebP. Max 5MB.</p>
              </div>
            )}

            {/* Technical Evidence link */}
            <div className="mt-6 pt-4 border-t border-white/5">
              <h3 className="text-sm font-semibold text-white mb-2">🔧 Technical Evidence</h3>
              <Link href="/proof" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                Engineering proof and concurrency reports →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Events Table ───────────────────────────────── */}
        <div className="glass-card p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">📋 All Events</h2>
            <button onClick={loadEvents} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Refresh
            </button>
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No events found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-3 text-xs text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left py-3 px-3 text-xs text-gray-500 uppercase tracking-wider hidden sm:table-cell">Venue</th>
                    <th className="text-left py-3 px-3 text-xs text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                    <th className="text-left py-3 px-3 text-xs text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-3 text-xs text-gray-500 uppercase tracking-wider hidden lg:table-cell">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e: any) => (
                    <tr key={e.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-white font-medium">{e.name}</td>
                      <td className="py-3 px-3 text-gray-400 hidden sm:table-cell">{e.venue}</td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-300">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`badge-status ${e.status || 'DRAFT'}`}>
                          {e.status || 'DRAFT'}
                        </span>
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        {e.coverImageUrl ? (
                          <span className="text-xs text-green-400">✓ Uploaded</span>
                        ) : (
                          <span className="text-xs text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
