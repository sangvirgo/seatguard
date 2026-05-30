// SeatGuard API Client — All requests go through API Gateway via Next.js rewrites

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const url = typeof window !== 'undefined' ? path : `${process.env.API_GATEWAY_URL || 'http://localhost:8080'}${path}`;
  try {
    const res = await fetch(url, { ...options, headers: { ...getHeaders(), ...options.headers } });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, ok: res.ok };
  } catch (e: any) {
    return { status: 0, data: { message: 'Network error. Please check your connection and try again.' }, ok: false };
  }
}

// ─── Auth ──────────────────────────────────────────────
export async function register(email: string, password: string, fullName: string) {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName, phone: '+84900000000' }),
  });
  if (res.ok && res.data.accessToken) {
    localStorage.setItem('token', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    const me = await getProfile();
    if (me) localStorage.setItem('userId', me.id);
  }
  return res;
}

export async function login(email: string, password: string) {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.ok && res.data.accessToken) {
    localStorage.setItem('token', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    const me = await getProfile();
    if (me) localStorage.setItem('userId', me.id);
  }
  return res;
}

export async function getProfile() {
  const res = await apiFetch('/api/auth/me');
  return res.ok ? res.data : null;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
}

export function isLoggedIn() {
  return typeof window !== 'undefined' && !!localStorage.getItem('token');
}

export function getUserId() {
  return typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
}

// ─── Events ───────────────────────────────────────────
export async function listEvents() {
  const res = await apiFetch('/api/events?size=100');
  return res.ok ? (res.data.data?.content || res.data.content || []) : [];
}

export async function getEvent(id: string) {
  const res = await apiFetch(`/api/events/${id}`);
  return res.ok ? res.data.data || res.data : null;
}

export async function createEvent(name: string, venue: string, category: string) {
  return apiFetch('/api/events', {
    method: 'POST',
    body: JSON.stringify({
      name, venue, category,
      description: 'Demo event created from SeatGuard frontend',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 2 * 86400000).toISOString(),
    }),
  });
}

export async function addSection(eventId: string, name: string, price: number, capacity: number) {
  return apiFetch(`/api/events/${eventId}/sections`, {
    method: 'POST',
    body: JSON.stringify({ name, description: 'Section', price, capacity }),
  });
}

export async function generateSeats(eventId: string, rows: number, seatsPerRow: number) {
  return apiFetch(`/api/events/${eventId}/seats/generate`, {
    method: 'POST',
    body: JSON.stringify({ rowsPerSection: rows, seatsPerRow }),
  });
}

export async function publishEvent(eventId: string) {
  return apiFetch(`/api/events/${eventId}/publish`, { method: 'POST' });
}

export async function uploadEventImage(eventId: string, file: File) {
  const formData = new FormData();
  formData.append('image', file);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = typeof window !== 'undefined' ? `/api/events/${eventId}/image` : `${process.env.API_GATEWAY_URL || 'http://localhost:8080'}/api/events/${eventId}/image`;
  try {
    const res = await fetch(url, { method: 'POST', headers, body: formData });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, ok: res.ok };
  } catch (e: any) {
    return { status: 0, data: { message: 'Network error' }, ok: false };
  }
}

export async function getSeatMap(eventId: string) {
  const res = await apiFetch(`/api/events/${eventId}/seat-map`);
  return res.ok ? res.data.data || res.data : null;
}

// ─── Bookings ─────────────────────────────────────────
export async function holdSeat(eventId: string, seatId: string) {
  return apiFetch('/api/bookings/hold', {
    method: 'POST',
    body: JSON.stringify({
      eventId, seatId,
      idempotencyKey: `web-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }),
  });
}

export async function payBooking(bookingId: string) {
  return apiFetch(`/api/bookings/${bookingId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod: 'CREDIT_CARD' }),
  });
}

export async function getBooking(bookingId: string) {
  return apiFetch(`/api/bookings/${bookingId}`);
}

// ─── Tickets ──────────────────────────────────────────
export async function getMyTickets() {
  const res = await apiFetch('/api/tickets/me');
  return res.ok ? (res.data.data || []) : [];
}

export async function getTicket(ticketId: string) {
  return apiFetch(`/api/tickets/${ticketId}`);
}

export async function checkInTicket(ticketId: string) {
  return apiFetch(`/api/tickets/${ticketId}/check-in`, { method: 'POST' });
}

export async function checkInByCode(code: string) {
  return apiFetch('/api/tickets/check-in/by-code', {
    method: 'POST',
    body: JSON.stringify({ checkInCode: code }),
  });
}
