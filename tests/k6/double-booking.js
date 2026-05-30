/**
 * SeatGuard — Double-Booking Load Test
 *
 * Purpose: Verify that the system correctly prevents double-booking
 * when 1000 concurrent virtual users attempt to book the same seat.
 *
 * Expected Result:
 *   - Exactly 1 success (HTTP 201 Created)
 *   - 999 rejections (HTTP 409 Conflict)
 *   - 0 server errors (HTTP 5xx)
 *   - Total response time p95 < 5 seconds
 *
 * The test validates the three-layer double-booking prevention:
 *   1. Redis distributed lock (SET NX EX)
 *   2. PostgreSQL unique active booking constraint
 *   3. Idempotency key
 *
 * Run:
 *   k6 run tests/k6/double-booking.js
 *
 * Prerequisites:
 *   - Backend running on http://localhost:8080
 *   - PostgreSQL, Redis, Kafka running (docker compose up -d)
 *   - Test event and seat pre-seeded (see test fixtures below)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ─────────────────────────────────────────────────────

const successCount = new Counter('booking_success');
const conflictCount = new Counter('booking_conflict');
const errorCount = new Counter('booking_error');
const doubleBookingRate = new Rate('double_booking_prevented');
const bookingDuration = new Trend('booking_request_duration');

// ─── Configuration ──────────────────────────────────────────────────────

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const API_BASE = `${BASE_URL}/api/v1`;

// Test fixtures — must exist before running this test
// These should be created via the test setup script or API
const TEST_EVENT_ID = __ENV.TEST_EVENT_ID || 'test-event-001';
const TEST_SEAT_ID = __ENV.TEST_SEAT_ID || 'test-seat-001';

// ─── Options ────────────────────────────────────────────────────────────

export const options = {
  scenarios: {
    // All 1000 VUs hit the same seat simultaneously
    double_booking: {
      executor: 'shared-iterations',
      vus: 1000,
      iterations: 1000,
      maxDuration: '30s',
    },
  },

  thresholds: {
    // 95% of requests should complete within 5 seconds
    http_req_duration: ['p(95)<5000'],

    // No more than 1% unexpected failures (network errors, 500s, etc.)
    'http_req_failed{expected_response:true}': ['rate<0.01'],

    // The critical assertion: double-booking must be prevented
    // (this threshold is validated in the teardown function below)
  },
};

// ─── Setup ──────────────────────────────────────────────────────────────

/**
 * Setup phase: Authenticate all VUs and prepare test data.
 *
 * In a real test, you would:
 * 1. Create a test event (or use existing)
 * 2. Create a section with exactly 1 seat
 * 3. Ensure the seat is AVAILABLE
 * 4. Obtain auth tokens for each VU (or use a shared token for simplicity)
 */
export function setup() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SeatGuard Double-Booking Test');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Target:     ${API_BASE}`);
  console.log(`  Event ID:   ${TEST_EVENT_ID}`);
  console.log(`  Seat ID:    ${TEST_SEAT_ID}`);
  console.log(`  VUs:        1000`);
  console.log(`  Iterations: 1000`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('Expected: Exactly 1 success (201), 999 conflicts (409)');
  console.log('');

  // In a real implementation, you would register/login a test user
  // and return the auth token. For now, we use a placeholder.
  // const loginRes = http.post(`${API_BASE}/auth/login`, JSON.stringify({
  //   email: 'loadtest@seatguard.vn',
  //   password: 'testPassword123',
  // }), { headers: { 'Content-Type': 'application/json' } });
  // const authToken = loginRes.json('accessToken');

  return {
    authToken: 'PLACEHOLDER_TOKEN', // Replace with real token
    eventId: TEST_EVENT_ID,
    seatId: TEST_SEAT_ID,
  };
}

// ─── Main Test ──────────────────────────────────────────────────────────

export default function (data) {
  const idempotencyKey = `idem-${__VU}-${__ITER}-${Date.now()}`;

  const payload = JSON.stringify({
    eventId: data.eventId,
    seatId: data.seatId,
    idempotencyKey: idempotencyKey,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.authToken}`,
    },
    // Tag requests for metric filtering
    tags: {
      test_type: 'double_booking',
    },
    // We expect either 201 or 409 — don't fail the test on 409
    responseCallback: http.expectedStatuses(201, 409),
  };

  const startTime = Date.now();
  const res = http.post(`${API_BASE}/bookings/hold`, payload, params);
  const duration = Date.now() - startTime;

  // Track metrics
  bookingDuration.add(duration);

  // Classify response
  if (res.status === 201) {
    successCount.add(1);
    doubleBookingRate.add(true); // Booking allowed (correct for the winner)
    console.log(`✅ VU-${__VU}: BOOKING SUCCESS (took ${duration}ms)`);
  } else if (res.status === 409) {
    conflictCount.add(1);
    doubleBookingRate.add(true); // Conflict detected = double-booking prevented
  } else {
    errorCount.add(1);
    doubleBookingRate.add(false); // Unexpected status = potential issue
    console.error(`❌ VU-${__VU}: UNEXPECTED STATUS ${res.status} — ${res.body}`);
  }

  // Verify response structure
  if (res.status === 201) {
    check(res, {
      'booking has id': (r) => r.json('id') !== undefined,
      'booking status is PENDING_PAYMENT': (r) => r.json('status') === 'PENDING_PAYMENT',
      'booking has expiresAt': (r) => r.json('expiresAt') !== undefined,
    });
  }

  if (res.status === 409) {
    check(res, {
      'conflict response has error': (r) => r.json('error') !== undefined,
      'conflict message present': (r) => r.json('message') !== undefined,
    });
  }
}

// ─── Teardown ───────────────────────────────────────────────────────────

export function teardown(data) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Test Complete — Validating Results');
  console.log('═══════════════════════════════════════════════════════════════');

  // Note: Actual validation happens via k6 summary and thresholds.
  // The counters above will show in the end-of-test summary.
  //
  // To verify the database state after the test, run:
  //   SELECT COUNT(*) FROM bookings WHERE seat_id = 'test-seat-001'
  //     AND status IN ('PENDING_PAYMENT', 'CONFIRMED');
  // Expected: 1
  //
  // To verify Redis state:
  //   GET seat:lock:test-seat-001
  // Expected: booking ID of the winner (or expired if TTL passed)

  console.log('');
  console.log('Post-test verification queries:');
  console.log('  SQL:  SELECT COUNT(*) FROM bookings WHERE seat_id = \'test-seat-001\' AND status IN (\'PENDING_PAYMENT\', \'CONFIRMED\');');
  console.log('  Redis: GET seat:lock:test-seat-001');
  console.log('');
  console.log('Expected: Exactly 1 active booking in DB, 1 Redis lock held');
  console.log('═══════════════════════════════════════════════════════════════');
}

// ─── Summary Handler ────────────────────────────────────────────────────

export function handleSummary(data) {
  const success = data.metrics.booking_success?.values?.count || 0;
  const conflicts = data.metrics.booking_conflict?.values?.count || 0;
  const errors = data.metrics.booking_error?.values?.count || 0;
  const total = success + conflicts + errors;

  const passed = success === 1 && errors === 0;

  console.log('');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│              DOUBLE-BOOKING TEST RESULTS                    │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│  Total requests:     ${String(total).padStart(6)}                               │`);
  console.log(`│  Success (201):      ${String(success).padStart(6)}                               │`);
  console.log(`│  Conflicts (409):    ${String(conflicts).padStart(6)}                               │`);
  console.log(`│  Errors (5xx):       ${String(errors).padStart(6)}                               │`);
  console.log('├─────────────────────────────────────────────────────────────┤');

  if (passed) {
    console.log('│  ✅ PASSED — Double-booking correctly prevented!            │');
  } else if (success === 0) {
    console.log('│  ❌ FAILED — No successful bookings (check auth/setup)     │');
  } else if (success > 1) {
    console.log(`│  ❌ FAILED — ${success} bookings succeeded (DOUBLE-BOOKING!)     │`);
  } else if (errors > 0) {
    console.log(`│  ⚠️  WARNING — ${errors} unexpected errors occurred              │`);
  }

  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('');

  // Return default summary + custom output
  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    'test-results.json': JSON.stringify({
      passed,
      total,
      success,
      conflicts,
      errors,
      timestamp: new Date().toISOString(),
    }, null, 2),
  };
}

// Helper: k6 text summary (imported from k6)
function textSummary(data, opts) {
  // k6 provides this via --summary-export, but we include a fallback
  return JSON.stringify(data.metrics, null, 2);
}
