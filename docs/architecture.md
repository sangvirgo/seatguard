# Architecture

## System Overview

SeatGuard is a microservices-based ticket booking platform designed for high-concurrency scenarios (concerts, sports events, theater).

## Service Architecture

### API Gateway (Spring Cloud Gateway)
- **Port:** 8080
- **Responsibility:** Request routing, rate limiting, JWT validation filter, CORS
- **Routes:** Proxies to all backend services based on path prefix

### Auth Service (Spring Boot)
- **Port:** 8081
- **Responsibility:** User registration, login, JWT token management, refresh tokens
- **Database:** `auth_db` — users table
- **Dependencies:** PostgreSQL, Redis (session/token cache)

### Event Service (Spring Boot)
- **Port:** 8082
- **Responsibility:** Event CRUD, section management, seat generation, seat map queries, event publishing
- **Database:** `event_db` — events, sections, seats tables
- **Dependencies:** PostgreSQL, Kafka (publish event lifecycle events)

### Booking Service (Spring Boot)
- **Port:** 8083
- **Responsibility:** Seat holding, payment processing, booking cancellation, booking queries
- **Database:** `booking_db` — bookings table
- **Dependencies:** PostgreSQL, Redis (distributed lock), Kafka (publish booking events)

### Ticket Service (Spring Boot)
- **Port:** 8084
- **Responsibility:** Ticket issuance after payment, QR code generation, check-in processing
- **Database:** `ticket_db` — tickets table
- **Dependencies:** PostgreSQL, Kafka (consume booking events, publish ticket events)

### Notification Service (NestJS)
- **Port:** 3000
- **Responsibility:** Real-time notifications via WebSocket, Kafka event consumption, notification persistence
- **Database:** `notification_db` — notifications table
- **Dependencies:** PostgreSQL, Kafka (consume all events), WebSocket

### Frontend (Next.js)
- **Port:** 3001
- **Responsibility:** User-facing web application — event browsing, seat selection, booking flow, ticket management

## Infrastructure

### PostgreSQL 16
- Separate database per service (shared instance)
- Connection pooling via HikariCP

### Redis 7
- Distributed locks for seat holding (SET NX EX with TTL)
- Token/session caching
- Rate limiting counters

### Apache Kafka 3.7 (KRaft Mode)
- No ZooKeeper dependency
- Topics: booking-events, ticket-events, notification-events
- Event sourcing for booking and ticket lifecycle

## Communication Patterns

### Synchronous (HTTP/REST)
- Frontend → API Gateway → Services
- Inter-service calls only through API Gateway

### Asynchronous (Kafka)
- Booking Service → Kafka → Ticket Service (on BOOKING_CONFIRMED)
- Booking Service → Kafka → Notification Service (all booking events)
- Ticket Service → Kafka → Notification Service (ticket events)

## Data Flow: Booking a Seat

```
1. User selects seat on frontend
2. POST /api/bookings/hold → API Gateway → Booking Service
3. Booking Service:
   a. Acquire Redis lock: SET seat:{seatId}:{userId} NX EX 300
   b. Check seat not already booked (DB query)
   c. Create booking record (PENDING_PAYMENT)
   d. Publish BOOKING_HELD to Kafka
4. User confirms payment
5. POST /api/bookings/{id}/pay → Booking Service
6. Booking Service:
   a. Update booking → CONFIRMED
   b. Publish BOOKING_CONFIRMED to Kafka
7. Ticket Service consumes BOOKING_CONFIRMED:
   a. Generate ticket with QR code
   b. Update seat → SOLD
   c. Publish TICKET_ISSUED to Kafka
8. Notification Service consumes events → WebSocket push to user
```

## Failure Handling

- **Redis lock expires (TTL):** Booking auto-expires, seat returns to AVAILABLE
- **Payment timeout:** Booking → EXPIRED after configurable TTL (default 5 min)
- **Kafka consumer failure:** Retry with exponential backoff, dead-letter queue
- **Service down:** Circuit breaker (Resilience4j), graceful degradation
