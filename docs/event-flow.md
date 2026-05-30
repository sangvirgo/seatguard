# Event Flow

## Kafka Configuration

- **Broker:** Apache Kafka 3.7 with KRaft mode (no ZooKeeper)
- **Topics:** 3 topics, 6 partitions each, replication factor 1 (dev), 3 (prod)

## Topics

| Topic | Producer | Consumers | Purpose |
|---|---|---|---|
| `booking.events` | Spring Boot (Booking) | Node.js (Notification) | Booking lifecycle events |
| `ticket.events` | Spring Boot (Ticket) | Node.js (Notification) | Ticket lifecycle events |
| `notification.events` | Node.js (Notification) | — | Internal notification processing |

## Event Types

### BOOKING_HELD

Published when a seat is successfully held for booking.

```json
{
  "eventId": "uuid",
  "eventType": "BOOKING_HELD",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "bookingId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "eventName": "Concert: Son Tung M-TP",
    "seatId": "uuid",
    "seatLabel": "A-1",
    "sectionName": "VIP",
    "price": 5000000,
    "expiresAt": "2024-01-15T10:35:00Z"
  }
}
```

**Triggers:**
- Notification: "Seat A-1 is being held for you. Complete payment within 5 minutes."

---

### BOOKING_CONFIRMED

Published when payment is successful and booking is confirmed.

```json
{
  "eventId": "uuid",
  "eventType": "BOOKING_CONFIRMED",
  "timestamp": "2024-01-15T10:32:00Z",
  "data": {
    "bookingId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "eventName": "Concert: Son Tung M-TP",
    "seatLabel": "A-1",
    "ticketId": "uuid",
    "paidAt": "2024-01-15T10:32:00Z"
  }
}
```

**Triggers:**
- Notification: "Payment confirmed! Your ticket for Concert: Son Tung M-TP (Seat A-1) is ready."
- Seat status: HELD → SOLD

---

### BOOKING_EXPIRED

Published when the 5-minute payment window expires.

```json
{
  "eventId": "uuid",
  "eventType": "BOOKING_EXPIRED",
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "bookingId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "eventName": "Concert: Son Tung M-TP",
    "seatLabel": "A-1",
    "expiredAt": "2024-01-15T10:35:00Z"
  }
}
```

**Triggers:**
- Notification: "Your booking for Seat A-1 has expired. The seat is now available again."
- Seat status: HELD → AVAILABLE
- Redis lock: Released

---

### BOOKING_CANCELLED

Published when a booking is cancelled by the user or system.

```json
{
  "eventId": "uuid",
  "eventType": "BOOKING_CANCELLED",
  "timestamp": "2024-01-15T10:33:00Z",
  "data": {
    "bookingId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "eventName": "Concert: Son Tung M-TP",
    "seatLabel": "A-1",
    "cancelledBy": "USER",
    "cancelledAt": "2024-01-15T10:33:00Z"
  }
}
```

**Triggers:**
- Notification: "Your booking for Seat A-1 has been cancelled."
- Seat status: HELD → AVAILABLE
- Redis lock: Released

---

### BOOKING_PAYMENT_FAILED

Published when payment processing fails.

```json
{
  "eventId": "uuid",
  "eventType": "BOOKING_PAYMENT_FAILED",
  "timestamp": "2024-01-15T10:32:00Z",
  "data": {
    "bookingId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "eventName": "Concert: Son Tung M-TP",
    "seatLabel": "A-1",
    "failureReason": "INSUFFICIENT_FUNDS",
    "failedAt": "2024-01-15T10:32:00Z"
  }
}
```

**Triggers:**
- Notification: "Payment failed for Seat A-1. Please try again before the hold expires."
- Seat status: Remains HELD (user can retry within TTL)

---

### TICKET_ISSUED

Published when a ticket is generated after successful payment.

```json
{
  "eventId": "uuid",
  "eventType": "TICKET_ISSUED",
  "timestamp": "2024-01-15T10:32:00Z",
  "data": {
    "ticketId": "uuid",
    "bookingId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "eventName": "Concert: Son Tung M-TP",
    "seatLabel": "A-1",
    "sectionName": "VIP",
    "qrCodeData": "TKT-{uuid}-{hmac_signature}",
    "issuedAt": "2024-01-15T10:32:00Z"
  }
}
```

**Triggers:**
- Notification: "Your ticket is ready! Show the QR code at the entrance."

---

### TICKET_USED

Published when a ticket is checked in at the venue.

```json
{
  "eventId": "uuid",
  "eventType": "TICKET_USED",
  "timestamp": "2024-06-15T18:45:00Z",
  "data": {
    "ticketId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "eventName": "Concert: Son Tung M-TP",
    "seatLabel": "A-1",
    "checkedInAt": "2024-06-15T18:45:00Z",
    "checkedInBy": "staff-uuid"
  }
}
```

**Triggers:**
- Notification: "Welcome! Your ticket for Seat A-1 has been scanned. Enjoy the show!"

---

## Event Flow Diagrams

### Successful Booking Flow

```
User          Backend         Redis        PostgreSQL      Kafka         Notification
 │               │              │              │             │               │
 │  Hold seat    │              │              │             │               │
 │──────────────▶│              │              │             │               │
 │               │  SET NX EX   │              │             │               │
 │               │─────────────▶│              │             │               │
 │               │  ✓ locked    │              │             │               │
 │               │◀─────────────│              │             │               │
 │               │              │              │             │               │
 │               │  INSERT      │              │             │               │
 │               │───────────────────────────▶│             │               │
 │               │  ✓ saved     │              │             │               │
 │               │◀───────────────────────────│             │               │
 │               │              │              │             │               │
 │               │  PUBLISH     │              │             │               │
 │               │────────────────────────────────────────▶│               │
 │  201 OK       │              │              │  BOOKING_HELD              │
 │◀──────────────│              │              │             │───────▶       │
 │               │              │              │             │  notify user  │
 │               │              │              │             │               │
 │  Pay          │              │              │             │               │
 │──────────────▶│              │              │             │               │
 │               │  UPDATE      │              │             │               │
 │               │───────────────────────────▶│             │               │
 │               │  ✓ confirmed │              │             │               │
 │               │◀───────────────────────────│             │               │
 │               │              │              │             │               │
 │               │  PUBLISH     │              │             │               │
 │               │────────────────────────────────────────▶│               │
 │               │              │              │ BOOKING_CONFIRMED          │
 │               │              │              │             │───────▶       │
 │               │              │              │             │  notify user  │
 │               │              │              │             │               │
 │               │  DEL NX      │              │             │               │
 │               │─────────────▶│              │             │               │
 │  200 OK       │              │              │             │               │
 │◀──────────────│              │              │             │               │
```

### Double-Booking Rejection Flow

```
User A        User B          Backend         Redis        PostgreSQL
 │               │               │              │              │
 │  Hold seat    │               │              │              │
 │──────────────▶│               │              │              │
 │               │               │  SET NX EX   │              │
 │               │               │─────────────▶│              │
 │               │               │  ✓ locked    │              │
 │               │               │◀─────────────│              │
 │               │               │              │              │
 │               │               │  INSERT      │              │
 │               │               │───────────────────────────▶│
 │               │               │  ✓ saved     │              │
 │               │               │◀───────────────────────────│
 │               │               │              │              │
 │               │  Hold same    │              │              │
 │               │──────────────▶│              │              │
 │               │               │  SET NX EX   │              │
 │               │               │─────────────▶│              │
 │               │               │  ✗ exists    │              │
 │               │               │◀─────────────│              │
 │               │               │              │              │
 │               │  409 Conflict │              │              │
 │               │◀──────────────│              │              │
```

### Booking Expiration Flow

```
Scheduler       Backend         Redis        PostgreSQL      Kafka
 │               │              │              │              │
 │  Find expired │              │              │              │
 │──────────────▶│              │              │              │
 │               │  SELECT      │              │              │
 │               │  WHERE       │              │              │
 │               │  expires_at  │              │              │
 │               │  < now()     │              │              │
 │               │───────────────────────────▶│              │
 │               │  expired     │              │              │
 │               │  bookings    │              │              │
 │               │◀───────────────────────────│              │
 │               │              │              │              │
 │               │  DEL lock    │              │              │
 │               │─────────────▶│              │              │
 │               │  ✓ released  │              │              │
 │               │◀─────────────│              │              │
 │               │              │              │              │
 │               │  UPDATE      │              │              │
 │               │  SET status  │              │              │
 │               │  = 'EXPIRED' │              │              │
 │               │───────────────────────────▶│              │
 │               │  ✓ updated   │              │              │
 │               │◀───────────────────────────│              │
 │               │              │              │              │
 │               │  PUBLISH     │              │              │
 │               │─────────────────────────────────────────▶│
 │               │              │              │ BOOKING_EXPIRED
 │               │              │              │              │
```

## Consumer Group Configuration

| Consumer Group | Subscribed Topics | Instances |
|---|---|---|
| `notification-service` | `booking.events`, `ticket.events` | 3 (scaled) |

## Error Handling

- **Dead Letter Queue (DLQ):** Failed messages after 3 retries are sent to `{topic}.dlq`
- **Retry Policy:** Exponential backoff — 1s, 5s, 15s
- **Idempotency:** All consumers are idempotent (check if notification already exists before creating)

## Monitoring

- **Lag:** Monitor consumer lag per partition
- **Throughput:** Messages/second per topic
- **Error Rate:** DLQ message count
