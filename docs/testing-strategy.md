# Testing Strategy

## Overview

SeatGuard uses a multi-layered testing strategy to ensure correctness, reliability, and performance — with special emphasis on preventing double-booking under high concurrency.

---

## 1. Load Testing (k6)

### Double-Booking Test

**Purpose:** Verify that the system correctly prevents double-booking when 1000 concurrent virtual users attempt to book the same seat simultaneously.

**Expected Result:** Exactly 1 success (201 Created), 999 rejections (409 Conflict).

**File:** `tests/k6/double-booking.js`

**Test Design:**

```
Scenario: 1000 VUs all attempt to hold the same seat at t=0

VU-1:   POST /bookings/hold → 201 Created  ✓ (winner)
VU-2:   POST /bookings/hold → 409 Conflict ✗
VU-3:   POST /bookings/hold → 409 Conflict ✗
...
VU-1000: POST /bookings/hold → 409 Conflict ✗

Assert: success_count == 1
Assert: conflict_count == 999
Assert: total_count == 1000
```

**Configuration:**
```javascript
export const options = {
  scenarios: {
    double_booking: {
      executor: 'shared-iterations',
      vus: 1000,
      iterations: 1000,
      maxDuration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% under 5s
    'http_req_failed{expected_response:true}': ['rate<0.01'], // <1% unexpected failures
  },
};
```

**Validation Checks:**
1. Total responses = 1000
2. Exactly 1 response = 201 (Created)
3. All other responses = 409 (Conflict)
4. No 500 errors (server errors)
5. Redis lock correctly released after test
6. Database has exactly 1 booking for the seat

---

### Hold Duration Test

**Purpose:** Verify that seat holds expire after the configured TTL (5 minutes).

**Test Flow:**
1. Hold a seat
2. Wait 5 minutes + buffer
3. Attempt to hold same seat from different user
4. Assert: Second hold succeeds (201)

---

### Concurrent Event Booking Test

**Purpose:** Verify system performance when multiple users book different seats in the same event.

**Configuration:**
- 100 VUs
- Each VU books a unique seat
- Duration: 60 seconds

**Expected Result:** All 100 bookings succeed (201 Created), no conflicts.

---

## 2. Integration Tests

### Booking Flow Integration Tests

| Test Case | Description | Expected Result |
|---|---|---|
| `hold_seat_success` | User holds an available seat | 201, seat status = HELD |
| `hold_seat_already_held` | User holds a seat held by another | 409 Conflict |
| `hold_seat_already_sold` | User holds a sold seat | 409 Conflict |
| `hold_seat_idempotent` | Same user holds same seat with same idempotency key | 200 (cached response) |
| `pay_booking_success` | User pays for held seat | 200, booking = CONFIRMED, ticket created |
| `pay_expired_booking` | User pays after hold expires | 409 Conflict |
| `cancel_booking_success` | User cancels held seat | 200, seat = AVAILABLE |
| `cancel_confirmed_booking` | User cancels confirmed booking | 200, seat = AVAILABLE (with refund) |
| `expire_holds` | Scheduler expires old holds | Seats return to AVAILABLE |
| `full_booking_flow` | Hold → Pay → Ticket → Check-in | All states transition correctly |

### Redis Lock Integration Tests

| Test Case | Description | Expected Result |
|---|---|---|
| `lock_acquired` | SET NX succeeds on available key | Lock acquired |
| `lock_rejected` | SET NX fails on existing key | Lock rejected |
| `lock_expires` | Lock expires after TTL | Lock auto-released |
| `lock_released` | Explicit DEL on cancel | Lock released immediately |

### Database Constraint Tests

| Test Case | Description | Expected Result |
|---|---|---|
| `unique_active_booking` | Two active bookings for same seat | Unique constraint violation |
| `multiple_expired_bookings` | Multiple expired bookings for same seat | Allowed (not active) |
| `active_after_expired` | New booking after previous expired | Allowed |

---

## 3. Unit Tests

### Backend (Java / JUnit 5 + Mockito)

**BookingService Tests:**
- `shouldHoldSeatWhenAvailable`
- `shouldRejectWhenSeatAlreadyHeld`
- `shouldRejectWhenSeatAlreadySold`
- `shouldCreateBookingWithPendingPaymentStatus`
- `shouldSetExpirationTimeToFiveMinutes`
- `shouldGenerateIdempotencyKey`
- `shouldReturnCachedResponseForDuplicateIdempotencyKey`

**BookingExpirationScheduler Tests:**
- `shouldExpireBookingsPastDeadline`
- `shouldNotExpireConfirmedBookings`
- `shouldReleaseRedisLockOnExpiration`
- `shouldPublishBookingExpiredEvent`

**PaymentService Tests:**
- `shouldConfirmBookingOnSuccessfulPayment`
- `shouldFailBookingOnPaymentError`
- `shouldNotProcessPaymentForExpiredBooking`
- `shouldNotProcessPaymentForCancelledBooking`

**TicketService Tests:**
- `shouldGenerateTicketOnBookingConfirmation`
- `shouldGenerateUniqueQRCode`
- `shouldCheckInValidTicket`
- `shouldRejectAlreadyUsedTicket`
- `shouldRejectCancelledTicket`

**EventService Tests:**
- `shouldGenerateSeatsForSection`
- `shouldNotAllowPublishingWithoutSeats`
- `shouldReturnCorrectSeatAvailability`

### Notification Service (Node.js / Vitest)

**Kafka Consumer Tests:**
- `shouldProcessBookingHeldEvent`
- `shouldProcessBookingConfirmedEvent`
- `shouldHandleDuplicateEvents`
- `shouldRetryOnTransientFailure`

**WebSocket Tests:**
- `shouldNotifyConnectedUser`
- `shouldHandleDisconnectGracefully`
- `shouldNotNotifyOtherUsers`

---

## 4. Test Data Setup

### Pre-test Fixtures

```sql
-- Test event
INSERT INTO events (id, name, venue, start_time, end_time, status)
VALUES ('test-event-uuid', 'Test Concert', 'Test Venue', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '3 hours', 'PUBLISHED');

-- Test section
INSERT INTO sections (id, event_id, name, price, row_count, seats_per_row)
VALUES ('test-section-uuid', 'test-event-uuid', 'VIP', 1000000, 1, 1);

-- Test seat (single seat for double-booking test)
INSERT INTO seats (id, section_id, row_label, seat_number, label, status)
VALUES ('test-seat-uuid', 'test-section-uuid', 'A', '1', 'A-1', 'AVAILABLE');
```

---

## 5. CI/CD Integration

### Pipeline Stages

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  Build   │───▶│  Unit Tests  │───▶│ Integration  │───▶│   Deploy    │
│          │    │              │    │   Tests      │    │             │
└──────────┘    └──────────────┘    └──────────────┘    └─────────────┘
                                       │
                                       ▼
                                 ┌──────────────┐
                                 │  k6 Load     │
                                 │  Tests       │
                                 │ (staging)    │
                                 └──────────────┘
```

### Test Coverage Targets

| Layer | Target | Tool |
|---|---|---|
| Backend Unit | >80% | JaCoCo |
| Backend Integration | >70% | JaCoCo |
| Notification Unit | >80% | Vitest coverage |
| API Contract | 100% endpoints | k6 + Postman |

---

## 6. Chaos Testing (Future)

- **Redis failure:** Verify booking falls back to DB-only (slower but correct)
- **Kafka lag:** Verify notification delivery under high consumer lag
- **Network partition:** Verify booking behavior during DB connectivity issues
- **Clock skew:** Verify TTL behavior with slightly different clocks
