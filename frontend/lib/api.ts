// SeatGuard API Client
// Direct service URLs (API Gateway routing may not be complete)

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8081';
const EVENT_URL = process.env.NEXT_PUBLIC_EVENT_URL || 'http://localhost:8082';
const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL || 'http://localhost:8083';
const TICKET_URL = process.env.NEXT_PUBLIC_TICKET_URL || 'http://localhost:8084';

function getHeaders(userId?: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const uid = userId || localStorage.getItem('userId');
    if (uid) headers['X-User-Id'] = uid;
  }
  return headers;
}

async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data, ok: res.ok };
}

// ─── Auth ──────────────────────────────────────────────
export async function register(email: string, password: string, fullName: string) {
  const res = await apiFetch(`${AUTH_URL}/api/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password, fullName, phone: '+84900000000' }),
  });
  if (res.ok && res.data.accessToken) {
    localStorage.setItem('token', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    // Get userId from /me
    const me = await getProfile();
    if (me) localStorage.setItem('userId', me.id);
  }
  return res;
}

export async function login(email: string, password: string) {
  const res = await apiFetch(`${AUTH_URL}/api/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
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
  const res = await apiFetch(`${AUTH_URL}/api/auth/me`, {
    headers: getHeaders(),
  });
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
  const res = await apiFetch(`${EVENT_URL}/api/events?size=100`, {
    headers: getHeaders(),
  });
  return res.ok ? (res.data.data?.content || res.data.content || []) : [];
}

export async function getEvent(id: string) {
  const res = await apiFetch(`${EVENT_URL}/api/events/${id}`, {
    headers: getHeaders(),
  });
  return res.ok ? res.data.data || res.data : null;
}

export async function createEvent(name: string, venue: string, category: string) {
  const res = await apiFetch(`${EVENT_URL}/api/events`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      name, venue, category,
      description: 'Demo event created from SeatGuard frontend',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 2 * 86400000).toISOString(),
    }),
  });
  return res;
}

export async function addSection(eventId: string, name: string, price: number, capacity: number) {
  return apiFetch(`${EVENT_URL}/api/events/${eventId}/sections`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, description: 'Section', price, capacity }),
  });
}

export async function generateSeats(eventId: string, rows: number, seatsPerRow: number) {
  return apiFetch(`${EVENT_URL}/api/events/${eventId}/seats/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ rowsPerSection: rows, seatsPerRow }),
  });
}

export async function publishEvent(eventId: string) {
  return apiFetch(`${EVENT_URL}/api/events/${eventId}/publish`, {
    method: 'POST',
    headers: getHeaders(),
  });
}

export async function getSeatMap(eventId: string) {
  const res = await apiFetch(`${EVENT_URL}/api/events/${eventId}/seat-map`, {
    headers: getHeaders(),
  });
  return res.ok ? res.data.data || res.data : null;
}

// ─── Bookings ─────────────────────────────────────────
export async function holdSeat(eventId: string, seatId: string) {
  const userId = getUserId();
  return apiFetch(`${BOOKING_URL}/api/bookings/hold`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      eventId, seatId,
      idempotencyKey: `web-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }),
  });
}

export async function payBooking(bookingId: string) {
  return apiFetch(`${BOOKING_URL}/api/bookings/${bookingId}/pay`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ paymentMethod: 'CREDIT_CARD' }),
  });
}

export async function getBooking(bookingId: string) {
  return apiFetch(`${BOOKING_URL}/api/bookings/${bookingId}`, {
    headers: getHeaders(),
  });
}

// ─── Tickets ──────────────────────────────────────────
export async function getMyTickets() {
  const userId = getUserId();
  const res = await apiFetch(`${TICKET_URL}/api/tickets/me`, {
    headers: getHeaders(),
  });
  return res.ok ? (res.data.data || []) : [];
}

export async function getTicket(ticketId: string) {
  return apiFetch(`${TICKET_URL}/api/tickets/${ticketId}`, {
    headers: getHeaders(),
  });
}

export async function checkInTicket(ticketId: string) {
  return apiFetch(`${TICKET_URL}/api/tickets/${ticketId}/check-in`, {
    method: 'POST',
    headers: getHeaders(),
  });
}

export async function checkInByCode(code: string) {
  return apiFetch(`${TICKET_URL}/api/tickets/check-in/by-code`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ checkInCode: code }),
  });
}
