# Task 2 — Booking & Payment Flow Inspection Report

**Branch:** `feature/backend-google-oauth-admin-rbac`
**Date:** 2026-05-30
**Status:** Read-only inspection (no files modified)

---

## 1. Current Booking Statuses (Enum Values)

**File:** `BookingStatus.java`

| Status | Description |
|---|---|
| `PENDING_PAYMENT` | Initial state after seat hold; awaiting payment |
| `CONFIRMED` | Payment confirmed; ticket issued |
| `EXPIRED` | Hold TTL expired (default 300s) or scheduled expiry job ran |
| `CANCELLED` | User cancelled before payment |
| `PAYMENT_FAILED` | Declared but **never set anywhere** in the codebase (unused) |

### State Transitions Observed

```
holdSeat()        → PENDING_PAYMENT
confirmPayment()  → PENDING_PAYMENT → CONFIRMED
cancelBooking()   → PENDING_PAYMENT → CANCELLED
expireBookings()  → PENDING_PAYMENT → EXPIRED  (scheduled job, every 30s)
```

> ⚠️ `PAYMENT_FAILED` is defined in the enum but no code path ever sets it.

---

## 2. Current Payment Mock Flow (How "Pay" Works)

### End-to-End Flow

```
Frontend                    API Gateway           Booking Service           Kafka              Ticket Service
   │                            │                      │                     │                      │
   │  POST /api/bookings/hold   │                      │                     │                      │
   │  {eventId, seatId, key}    │──────────────────────>│                     │                      │
   │                            │                      │─ Redis lock         │                      │
   │                            │                      │─ Create Booking     │                      │
   │                            │                      │  (PENDING_PAYMENT)  │                      │
   │                            │                      │─ publish BOOKING_HELD│                     │
   │<─────── 201 + bookingId ───│<─────────────────────│                     │                      │
   │                            │                      │                     │                      │
   │  POST /api/bookings/{id}/pay                      │                     │                      │
   │  {paymentMethod: "CREDIT_CARD"}                   │                     │                      │
   │────────────────────────────>│─────────────────────>│                     │                      │
   │                            │                      │─ Verify PENDING_PAYMENT                    │
   │                            │                      │─ Check expiry       │                      │
   │                            │                      │─ Set CONFIRMED      │                      │
   │                            │                      │─ Set paidAt = now() │                      │
   │                            │                      │─ publish BOOKING_CONFIRMED──────────────────>│
   │                            │                      │─ Release Redis lock │                      │─ Create Ticket
   │<─────── 200 + booking ─────│<─────────────────────│                     │                      │─ Generate check-in code
   │                            │                      │                     │                      │
   │  (user sees "confirmed")   │                      │                     │                      │
```

### Key Details

- **No real payment gateway integration** — the `pay` endpoint is a **no-op mock**. It accepts `{ paymentMethod: "CREDIT_CARD" }` but **never validates charges, never calls a PSP, never stores transaction IDs**.
- The `paymentDetails` field in `PayBookingRequest` is declared (`Map<String, String>`) but **never read** by `BookingService.confirmPayment()`.
- The `paymentMethod` string is logged (`log.info("Booking confirmed: id={}, paymentMethod={}", ...)`) but not stored.
- **Total amount** is a hardcoded default (`booking.default-amount: 50.00`) set during `holdSeat()`, not based on seat/section pricing.

### Frontend Mock Details

```typescript
// api.ts — payBooking function
export async function payBooking(bookingId: string) {
  return apiFetch(`/api/bookings/${bookingId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod: 'CREDIT_CARD' }),  // Hardcoded mock
  });
}
```

The UI shows a "💳 Pay Now" button that immediately calls the pay endpoint. No payment form, no card input, no redirect to a PSP.

---

## 3. Where Booking Is Confirmed (Which Method)

**File:** `BookingService.java` → `confirmPayment(UUID bookingId, PayBookingRequest request)`

```java
@Transactional
public BookingResponse confirmPayment(UUID bookingId, PayBookingRequest request) {
    // 1. Find booking by ID
    Booking booking = bookingRepository.findById(bookingId)...;

    // 2. Verify status == PENDING_PAYMENT (throws InvalidBookingStateException otherwise)

    // 3. Check expiry — if expired, set EXPIRED + release lock + throw

    // 4. Update: status → CONFIRMED, paidAt → Instant.now()
    booking.setStatus(BookingStatus.CONFIRMED);
    booking.setPaidAt(Instant.now());
    booking = bookingRepository.save(booking);

    // 5. Publish BOOKING_CONFIRMED to Kafka
    eventProducer.publishBookingConfirmed(booking);

    // 6. Release Redis lock
    redisLockService.releaseLock(booking.getSeatId().toString());

    return BookingResponse.from(booking);
}
```

**Controller endpoint:** `POST /api/bookings/{bookingId}/pay`

---

## 4. Where Kafka BOOKING_CONFIRMED Event Is Published

**File:** `BookingEventProducer.java` → `publishBookingConfirmed(Booking booking)`

- **Topic:** `booking-events` (configurable via `kafka.topics.booking-events`)
- **Key:** `booking.getId().toString()` (booking UUID)
- **Value:** `Map<String, Object>` with fields:
  - `eventType`: `"BOOKING_CONFIRMED"`
  - `bookingId`, `userId`, `eventId`, `seatId`: UUID strings
  - `totalAmount`: BigDecimal
  - `timestamp`: Instant
- **Serializer:** `JsonSerializer` (configured in `application.yml`)

### Kafka Topic Configuration (application.yml)

```yaml
kafka:
  bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
  producer:
    key-serializer: org.apache.kafka.common.serialization.StringSerializer
    value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
  topics:
    booking-events: booking-events
```

### Consumer Side (Ticket Service)

**File:** `BookingEventConsumer.java`

- Listens on `booking-events` topic, group `ticket-service-group`
- On `BOOKING_CONFIRMED`: creates a `Ticket` entity with status `VALID`, generates check-in code (`SG-XXXXXXXX`), stores QR data
- On `BOOKING_CANCELLED`: sets existing ticket status to `CANCELLED`
- Idempotent: skips if ticket already exists for booking ID

---

## 5. Recommended Payment Integration Point

### Primary Integration Point: `BookingService.confirmPayment()`

This is the **single chokepoint** where payment must be validated before confirming. Currently it's a pass-through mock.

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Frontend                                                           │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────────────┐  │
│  │ Pay Now   │───>│ Create Payment   │───>│ Redirect to PSP     │  │
│  │ Button    │    │ Intent (POST)    │    │ (VNPay/Stripe/etc)  │  │
│  └──────────┘    └──────────────────┘    └──────────┬───────────┘  │
│                                                     │              │
│                                          PSP callback/return       │
│                                                     │              │
│                     ┌──────────────────┐            │              │
│                     │ Payment Callback │<───────────┘              │
│                     │ (webhook/return) │                           │
│                     └────────┬─────────┘                           │
└──────────────────────────────┼─────────────────────────────────────┘
                               │
┌──────────────────────────────┼─────────────────────────────────────┐
│  booking-service             │                                     │
│                              ▼                                     │
│  ┌─────────────────────────────────────────────┐                   │
│  │ POST /api/bookings/{id}/pay                 │                   │
│  │  1. Verify PENDING_PAYMENT                  │                   │
│  │  2. Create Payment record (PENDING)         │                   │
│  │  3. Call PSP to create payment session      │                   │
│  │  4. Return PSP redirect URL to frontend     │                   │
│  └─────────────────────────────────────────────┘                   │
│                                                                     │
│  ┌─────────────────────────────────────────────┐                   │
│  │ POST /api/payments/callback (webhook)       │                   │
│  │  1. Verify PSP signature                    │                   │
│  │  2. Update Payment record status            │                   │
│  │  3. If SUCCESS → confirmPayment() internal  │                   │
│  │  4. If FAILED → set PAYMENT_FAILED status   │                   │
│  └─────────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Specific Changes to `confirmPayment()`

The method should be **split into two flows**:

1. **`initiatePayment(bookingId)`** — validates booking, calls PSP, returns redirect URL
2. **`handlePaymentCallback(pspPayload)`** — verifies webhook, then calls the existing confirmation logic

The existing `confirmPayment()` logic (lines that set CONFIRMED + publish Kafka) becomes the **internal** method called only after PSP callback verification.

### PSP Options for Vietnam

| Provider | Pros | Integration Type |
|---|---|---|
| **VNPay** | Most popular in Vietnam, QR support | Redirect + IPN callback |
| **MoMo** | Widely used, mobile-first | Redirect + IPN callback |
| **Stripe** | International, great DX | Redirect + Webhook |
| **PayOS** | Modern Vietnamese PSP, API-first | Redirect + Webhook |

---

## 6. DB Changes Needed for Payment Table

### New Entity: `Payment`

```sql
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id          UUID NOT NULL REFERENCES bookings(id),
    user_id             UUID NOT NULL,
    
    -- Amount
    amount              DECIMAL(12,2) NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'VND',
    
    -- PSP details
    psp_provider        VARCHAR(50) NOT NULL,         -- 'VNPAY', 'MOMO', 'STRIPE'
    psp_transaction_id  VARCHAR(255),                  -- PSP's transaction reference
    psp_order_id        VARCHAR(255),                  -- Our order ID sent to PSP
    psp_payment_url     TEXT,                           -- Redirect URL from PSP
    psp_raw_response    JSONB,                          -- Full PSP callback payload for audit
    
    -- Status
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    -- PENDING, PROCESSING, SUCCESS, FAILED, REFUNDED, EXPIRED
    
    -- Payment method
    payment_method      VARCHAR(50),                   -- 'CREDIT_CARD', 'QR_CODE', 'WALLET'
    
    -- Error tracking
    failure_reason      TEXT,
    failure_code        VARCHAR(100),
    
    -- Timestamps
    initiated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMP,
    expired_at          TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT uk_payment_booking_id UNIQUE (booking_id),
    CONSTRAINT uk_payment_psp_transaction_id UNIQUE (psp_transaction_id)
);

CREATE INDEX idx_payment_status ON payments(status);
CREATE INDEX idx_payment_psp_order_id ON payments(psp_order_id);
CREATE INDEX idx_payment_user_id ON payments(user_id);
```

### Modifications to Existing `bookings` Table

```sql
-- Add payment reference
ALTER TABLE bookings ADD COLUMN payment_id UUID REFERENCES payments(id);

-- Add PSP transaction ID for quick lookups
ALTER TABLE bookings ADD COLUMN psp_transaction_id VARCHAR(255);

-- Index for payment lookups
CREATE INDEX idx_booking_payment_id ON bookings(payment_id);
```

### New Columns on `Booking` Entity (Java)

```java
@Column
private UUID paymentId;

@Column(length = 255)
private String pspTransactionId;
```

### Payment Status Enum

```java
public enum PaymentStatus {
    PENDING,       // Created, awaiting PSP session
    PROCESSING,    // Redirected to PSP, awaiting callback
    SUCCESS,       // PSP confirmed payment
    FAILED,        // PSP rejected or error
    REFUNDED,      // Refund processed
    EXPIRED        // Payment window expired (should align with booking expiry)
}
```

### Additional Considerations

1. **Idempotency**: Payment creation should use booking ID as idempotency key (one payment per booking)
2. **Timeout alignment**: `payments.expired_at` should match `bookings.expires_at` (300s hold TTL)
3. **Audit trail**: Store full PSP response in `psp_raw_response` JSONB for dispute resolution
4. **Webhook replay protection**: Use PSP transaction ID + status to deduplicate callbacks
5. **Refund support**: `REFUNDED` status + separate `refunds` table for partial/full refund tracking

---

## Summary of Current Gaps

| Area | Current State | Gap |
|---|---|---|
| Payment validation | Mock (accepts anything) | No PSP integration |
| Payment data storage | Not stored | No payment table |
| Payment method | Logged only, not persisted | Need `payments` table |
| Amount calculation | Hardcoded `50.00` | Should come from seat/section price |
| `PAYMENT_FAILED` status | Defined but unused | Need callback handler to set it |
| Webhook handling | None | Need dedicated callback endpoint |
| Frontend payment UI | Single "Pay Now" button | Need PSP redirect flow |
| Refund capability | None | Need refund entity + flow |

---

*End of report. No files were modified during this inspection.*
