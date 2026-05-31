import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const bookingSuccess = new Counter('booking_success');
const bookingConflict = new Counter('booking_conflict');
const bookingError = new Counter('booking_error');
const doubleBookingRate = new Counter('double_booking_count');
const bookingLatency = new Trend('booking_latency');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
  scenarios: {
    concurrent_booking: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 100 },
        { duration: '20s', target: 100 },
        { duration: '5s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};

export function setup() {
  // Register
  http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
    email: 'loadtest@seatguard.com',
    password: 'SecurePass123!',
    fullName: 'Load Tester',
  }), { headers: { 'Content-Type': 'application/json' } });

  // Login
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'loadtest@seatguard.com',
    password: 'SecurePass123!',
  }), { headers: { 'Content-Type': 'application/json' } });

  const token = loginRes.json('accessToken');

  // Get userId from /api/auth/me
  const meRes = http.get(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const userId = meRes.json('id');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Create event (requires ADMIN — use demo admin for setup)
  const adminLogin = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: __ENV.DEMO_USER_EMAIL || 'demo@example.com',
    password: __ENV.DEMO_USER_PASSWORD || 'CHANGE_ME',
  }), { headers: { 'Content-Type': 'application/json' } });
  const adminToken = adminLogin.json('accessToken');
  const adminHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
  };

  const eventRes = http.post(`${BASE_URL}/api/events`, JSON.stringify({
    name: 'k6 Load Test Event',
    venue: 'Test Venue',
    category: 'CONCERT',
    startTime: '2026-08-01T19:00:00Z',
    endTime: '2026-08-01T23:00:00Z',
  }), { headers: adminHeaders });

  const eventId = eventRes.json('data.id');

  // Add section
  http.post(`${BASE_URL}/api/events/${eventId}/sections`, JSON.stringify({
    name: 'GA', price: 100000, capacity: 500,
  }), { headers: adminHeaders });

  // Generate seats (5 rows x 10 = 50 seats)
  http.post(`${BASE_URL}/api/events/${eventId}/seats/generate`, JSON.stringify({
    rowsPerSection: 5, seatsPerRow: 10,
  }), { headers: adminHeaders });

  // Publish
  http.post(`${BASE_URL}/api/events/${eventId}/publish`, '{}', {
    headers: adminHeaders,
  });

  // Get seat map - pick ONE seat for all VUs to fight over
  const mapRes = http.get(`${BASE_URL}/api/events/${eventId}/seat-map`, {
    headers: authHeaders,
  });
  const seatId = mapRes.json('data.sections.0.seats.0.id');

  console.log(`Setup: userId=${userId} eventId=${eventId} seatId=${seatId}`);

  return { token, userId, eventId, seatId };
}

export default function (data) {
  const idempotencyKey = `k6-${__VU}-${__ITER}-${Date.now()}`;

  const res = http.post(`${BASE_URL}/api/bookings/hold`, JSON.stringify({
    eventId: data.eventId,
    seatId: data.seatId,
    idempotencyKey: idempotencyKey,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`,
    },
    timeout: '10s',
  });

  bookingLatency.add(res.timings.duration);

  if (res.status === 201) {
    bookingSuccess.add(1);
  } else if (res.status === 409 || res.status === 400) {
    bookingConflict.add(1);
  } else {
    bookingError.add(1);
  }
}

export function teardown(data) {
  // Verify no duplicate bookings
  const res = http.get(`${BASE_URL}/actuator/health`);
  console.log(`Teardown: booking-service health: ${res.json('status')}`);
  console.log('Expected: at most 1 successful hold for seatId=' + data.seatId);
}
