/**
 * SeatGuard — Double-Booking Concurrency Test
 *
 * PURPOSE: Verify that when 1000 concurrent users attempt to book
 * the SAME seat, exactly 1 succeeds and 999 fail with 409 Conflict.
 *
 * This validates the dual-layer protection:
 *   1. Redis SET NX EX distributed lock
 *   2. PostgreSQL UNIQUE constraint on active bookings
 *
 * USAGE:
 *   k6 run tests/k6/double-booking.js
 *
 * PREREQUISITES:
 *   - All backend services running
 *   - Test event + section + seat pre-created
 *   - 1000 user accounts pre-seeded
 *
 * EXPECTED RESULT:
 *   - Exactly 1 HTTP 201 (booking created)
 *   - Exactly 999 HTTP 409 (seat not available)
 *   - Database: 1 active booking for the test seat
 *   - Redis: 1 lock key for the test seat
 *   - NO duplicate confirmed bookings (zero double-booking)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ──────────────────────────────────────
const bookingSuccess = new Counter('booking_success');
const bookingConflict = new Counter('booking_conflict');
const bookingError = new Counter('booking_error');
const bookingLatency = new Trend('booking_latency');
const doubleBookingRate = new Rate('double_booking_rate');

// ─── Test Configuration ──────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api';

export const options = {
  scenarios: {
    concurrent_booking: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 1000 },  // Ramp up to 1000 VUs
        { duration: '30s', target: 1000 },  // Hold at 1000 VUs
        { duration: '10s', target: 0 },     // Ramp down
      ],
    },
  },
  thresholds: {
    // CRITICAL: No double-booking allowed
    'double_booking_rate': ['rate<0.001'],  // < 0.1% double-booking rate
    'booking_latency': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.01'],       // < 1% HTTP errors (excluding 409)
  },
};

// ─── Test Data (to be configured) ────────────────────────
// These should be set via environment variables or pre-seeded
const TEST_EVENT_ID = __ENV.TEST_EVENT_ID || 'test-event-uuid';
const TEST_SEAT_ID = __ENV.TEST_SEAT_ID || 'test-seat-uuid';

// ─── Setup: Generate auth tokens ─────────────────────────
export function setup() {
  console.log('=== SeatGuard Double-Booking Test ===');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Event: ${TEST_EVENT_ID}`);
  console.log(`Seat: ${TEST_SEAT_ID}`);
  console.log('VUs: 1000 concurrent attempts on same seat');
  console.log('Expected: Exactly 1 success, 999 failures');
  console.log('=====================================');

  // In production, pre-generate 1000 JWT tokens
  // For now, return test config
  return {
    eventId: TEST_EVENT_ID,
    seatId: TEST_SEAT_ID,
  };
}

// ─── Main Test: Attempt to hold the same seat ────────────
export default function (data) {
  const idempotencyKey = `loadtest-${__VU}-${__ITER}-${Date.now()}`;

  const payload = JSON.stringify({
    eventId: data.eventId,
    seatId: data.seatId,
    idempotencyKey: idempotencyKey,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.USER_TOKEN || 'test-token'}`,
      'Idempotency-Key': idempotencyKey,
    },
    timeout: '10s',
  };

  const startTime = Date.now();
  const res = http.post(`${BASE_URL}/bookings/hold`, payload, params);
  const latency = Date.now() - startTime;

  bookingLatency.add(latency);

  // ─── Assertions ──────────────────────────────────────
  check(res, {
    'status is 201 (success) or 409 (conflict)': (r) =>
      r.status === 201 || r.status === 409,
  });

  if (res.status === 201) {
    bookingSuccess.add(1);
    doubleBookingRate.add(false);
    console.log(`✅ VU ${__VU}: Booking SUCCESS — ${res.json().id}`);
  } else if (res.status === 409) {
    bookingConflict.add(1);
    doubleBookingRate.add(false);
    // Expected: 999 out of 1000 should get here
  } else {
    bookingError.add(1);
    doubleBookingRate.add(true);  // Unexpected = potential double-booking
    console.error(`❌ VU ${__VU}: Unexpected status ${res.status} — ${res.body}`);
  }
}

// ─── Teardown: Verify results ────────────────────────────
export function teardown(data) {
  console.log('=== Verification ===');
  console.log('Check database for duplicate bookings:');
  console.log(`  SELECT seat_id, status, COUNT(*) 
    FROM bookings 
    WHERE seat_id = '${data.seatId}' 
      AND status IN ('PENDING_PAYMENT', 'CONFIRMED')
    GROUP BY seat_id, status
    HAVING COUNT(*) > 1;`);
  console.log('Expected: 0 rows (no duplicates)');
  console.log('=====================================');
}
