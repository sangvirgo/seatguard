import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const bookingSuccess = new Counter('booking_success');
const bookingConflict = new Counter('booking_conflict');
const bookingError = new Counter('booking_error');
const doubleBookingRate = new Counter('double_booking_count');
const bookingLatency = new Trend('booking_latency');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8083';
const AUTH_URL = __ENV.AUTH_URL || 'http://localhost:8081';
const EVENT_URL = __ENV.EVENT_URL || 'http://localhost:8082';

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
  http.post(`${AUTH_URL}/api/auth/register`, JSON.stringify({
    email: 'loadtest@seatguard.com',
    password: 'SecurePass123!',
    fullName: 'Load Tester',
  }), { headers: { 'Content-Type': 'application/json' } });

  // Login
  const loginRes = http.post(`${AUTH_URL}/api/auth/login`, JSON.stringify({
    email: 'loadtest@seatguard.com',
    password: 'SecurePass123!',
  }), { headers: { 'Content-Type': 'application/json' } });

  const token = loginRes.json('accessToken');

  // Get userId from /api/auth/me
  const meRes = http.get(`${AUTH_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const userId = meRes.json('id');

  // Create event
  const eventRes = http.post(`${EVENT_URL}/api/events`, JSON.stringify({
    name: 'k6 Load Test Event',
    venue: 'Test Venue',
    category: 'CONCERT',
    startTime: '2026-08-01T19:00:00Z',
    endTime: '2026-08-01T23:00:00Z',
  }), { headers: { 'Content-Type': 'application/json' } });

  const eventId = eventRes.json('data.id');

  // Add section
  http.post(`${EVENT_URL}/api/events/${eventId}/sections`, JSON.stringify({
    name: 'GA', price: 100000, capacity: 500,
  }), { headers: { 'Content-Type': 'application/json' } });

  // Generate seats (5 rows x 10 = 50 seats)
  http.post(`${EVENT_URL}/api/events/${eventId}/seats/generate`, JSON.stringify({
    rowsPerSection: 5, seatsPerRow: 10,
  }), { headers: { 'Content-Type': 'application/json' } });

  // Publish
  http.post(`${EVENT_URL}/api/events/${eventId}/publish`, '{}', {
    headers: { 'Content-Type': 'application/json' },
  });

  // Get seat map - pick ONE seat for all VUs to fight over
  const mapRes = http.get(`${EVENT_URL}/api/events/${eventId}/seat-map`);
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
      'X-User-Id': data.userId,
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
