# Event Flow — Kafka Events

## Overview

SeatGuard uses Apache Kafka (KRaft mode, no ZooKeeper) as the asynchronous message broker for inter-service communication. Events follow the **Outbox Pattern** for reliability.

## Kafka Configuration

- **Mode:** KRaft (no ZooKeeper)
- **Image:** bitnami/kafka:3.7
- **Topics:** Auto-created with 3 partitions, replication factor 1

## Topic Design

| Topic | Producer | Consumers | Purpose |
|-------|----------|-----------|---------|
| `booking-events` | booking-service | ticket-service, notification-service | Booking lifecycle |
| `ticket-events` | ticket-service | notification-service | Ticket lifecycle |

---

## Event Catalog

### BOOKING_HELD
- **Producer:** booking-service
- **Trigger:** User successfully holds a seat
- **Consumers:** notification-service

```json
{
  "eventId": "uuid",
  "eventType": "BOOKING_HELD",
  "timestamp": "2026-06-15T19:00:00Z",
  "data": {
    "bookingId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "seatId": "uuid",
    "expiresAt": "2026-06-15T19:05:00Z"
  }
}
```

### BOOKING_CONFIRMED
- **Producer:** booking-service
- **Trigger:** Payment successful
- **Consumers:** ticket-service (issue ticket), notification-service

```json
{
  "eventId": "uuid",
  "eventType": "BOOKING_CONFIRMED",
  "timestamp": "2026-06-15T19:02:00Z",
  "data": {
    "bookingId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "seatId": "uuid",
    "amount": 2500000,
    "paymentReference": "PAY-123456"
  }
}
```

### BOOKING_EXPIRED
- **Producer:** booking-service (scheduled task)
- **Trigger:** Payment TTL expired (default 5 min)
- **Consumers:** notification-service

```json
{
  "eventId": "uuid",
  "eventType": "BOOKING_EXPIRED",
  "timestamp": "2026-06-15T19:05:00Z",
  "data": {
    "bookingId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "seatId": "uuid"
  }
}
```

### BOOKING_CANCELLED
- **Producer:** booking-service
- **Trigger:** User cancels booking
- **Consumers:** ticket-service (cancel ticket if exists), notification-service

```json
{
  "eventId": "uuid",
  "eventType": "BOOKING_CANCELLED",
  "timestamp": "2026-06-15T19:03:00Z",
  "data": {
    "bookingId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "seatId": "uuid",
    "reason": "USER_INITIATED"
  }
}
```

### BOOKING_PAYMENT_FAILED
- **Producer:** booking-service
- **Trigger:** Payment processing error
- **Consumers:** notification-service

```json
{
  "eventId": "uuid",
  "eventType": "BOOKING_PAYMENT_FAILED",
  "timestamp": "2026-06-15T19:02:30Z",
  "data": {
    "bookingId": "uuid",
    "userId": "uuid",
    "error": "INSUFFICIENT_FUNDS"
  }
}
```

### TICKET_ISSUED
- **Producer:** ticket-service
- **Trigger:** Ticket created after booking confirmation
- **Consumers:** notification-service

```json
{
  "eventId": "uuid",
  "eventType": "TICKET_ISSUED",
  "timestamp": "2026-06-15T19:02:05Z",
  "data": {
    "ticketId": "uuid",
    "bookingId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "seatInfo": "VIP - Row A, Seat 1",
    "checkInCode": "SG-ABCD1234"
  }
}
```

### TICKET_USED
- **Producer:** ticket-service
- **Trigger:** Successful check-in
- **Consumers:** notification-service

```json
{
  "eventId": "uuid",
  "eventType": "TICKET_USED",
  "timestamp": "2026-06-15T18:55:00Z",
  "data": {
    "ticketId": "uuid",
    "userId": "uuid",
    "eventId": "uuid",
    "checkedInAt": "2026-06-15T18:55:00Z",
    "checkedInBy": "staff-uuid"
  }
}
```

---

## Event Flow Diagrams

### Happy Path: Booking → Ticket
```
User                Booking Svc         Kafka              Ticket Svc          Notification Svc
 │                      │                  │                    │                     │
 │──Hold seat──────────▶│                  │                    │                     │
 │                      │──BOOKING_HELED──▶│                    │                     │
 │◀─Booking PENDING─────│                  │──consume──────────▶│                     │
 │                      │                  │                    │                     │
 │──Pay────────────────▶│                  │                    │                     │
 │                      │──BOOKING_CONFIRMED─▶│                 │                     │
 │◀─Booking CONFIRMED───│                  │──consume──────────▶│                     │
 │                      │                  │                    │──Create ticket      │
 │                      │                  │                    │──TICKET_ISSUED─────▶│
 │                      │                  │                    │                     │──Push WS──▶User
 │                      │                  │                    │                     │
 │◀─Ticket + QR────────────────────────────────────────────────│                     │
```

### Expiry Flow
```
Booking Svc (scheduled task)     Kafka              Notification Svc
        │                          │                      │
        │──Check expired bookings  │                      │
        │──BOOKING_EXPIRED────────▶│                      │
        │                          │──consume────────────▶│
        │                          │                      │──Push WS──▶User
```

### Check-in Flow
```
Staff               Ticket Svc          Kafka              Notification Svc
 │                      │                  │                     │
 │──Scan QR / Enter code│                  │                     │
 │──Check-in───────────▶│                  │                     │
 │                      │──Validate ticket │                     │
 │                      │──Mark USED       │                     │
 │                      │──TICKET_USED────▶│                     │
 │◀─Check-in success────│                  │──consume──────────▶│
 │                      │                  │                     │──Push WS──▶User
```

---

## Consumer Configuration

```java
// Spring Boot Kafka consumer config
@Bean
public ConsumerFactory<String, BookingEvent> bookingEventConsumerFactory() {
    Map<String, Object> props = new HashMap<>();
    props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
    props.put(ConsumerConfig.GROUP_ID_CONFIG, "ticket-service-group");
    props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
    props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
    props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
    props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
    return new DefaultKafkaConsumerFactory<>(props);
}
```

## Error Handling

- **Retry:** 3 attempts with exponential backoff (1s, 2s, 4s)
- **Dead Letter Topic:** `booking-events.DLT` for failed messages
- **Idempotent consumers:** Check event ID before processing
