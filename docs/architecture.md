# Architecture Overview

## System Architecture

SeatGuard is a microservices system designed for high-throughput event ticketing with strong consistency guarantees on seat allocation.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                    │
│              Web App / Mobile App / Admin Panel                     │
└──────────────┬──────────────────────────────────┬───────────────────┘
               │ REST API                         │ WebSocket
               ▼                                  ▼
┌──────────────────────────────────┐   ┌──────────────────────────────┐
│        SPRING BOOT API           │   │   NODE.JS NOTIFICATION SVC   │
│         (Port 8080)              │   │        (Port 3001)           │
│                                  │   │                              │
│  ┌──────────┐  ┌──────────┐     │   │  ┌────────┐  ┌────────────┐ │
│  │  Auth    │  │  Event   │     │   │  │ Kafka  │  │ WebSocket  │ │
│  │ Module   │  │ Module   │     │   │  │Consumer│  │  Server    │ │
│  └──────────┘  └──────────┘     │   │  └────────┘  └────────────┘ │
│  ┌──────────┐  ┌──────────┐     │   │  ┌────────┐  ┌────────────┐ │
│  │ Booking  │  │ Ticket   │     │   │  │ Notif  │  │  Push      │ │
│  │ Module   │  │ Module   │     │   │  │ Store  │  │  Delivery  │ │
│  └──────────┘  └──────────┘     │   │  └────────┘  └────────────┘ │
│  ┌──────────┐                    │   └──────────────────────────────┘
│  │ Payment  │                    │               │
│  │ Module   │                    │               │ Consume
│  └──────────┘                    │               ▼
└──────────┬───────────────────────┘   ┌──────────────────────────────┐
           │                           │      APACHE KAFKA 3.7        │
           │ Read/Write                │      (KRaft Mode)            │
           ▼                           │                              │
┌──────────────────┐                  │  Topics:                     │
│   POSTGRESQL 16  │                  │  - booking.events            │
│                  │                  │  - ticket.events             │
│  ┌────────────┐  │  Publish ───────▶│  - notification.events      │
│  │   Users    │  │                  └──────────────────────────────┘
│  ├────────────┤  │
│  │   Events   │  │          ┌──────────────────────────────┐
│  ├────────────┤  │          │       REDIS 7                │
│  │  Sections  │  │          │                              │
│  ├────────────┤  │          │  seat:lock:{seatId}          │
│  │   Seats    │  │          │  idempotency:{key}           │
│  ├────────────┤  │          │  session:{token}             │
│  │  Bookings  │  │          └──────────────────────────────┘
│  ├────────────┤  │
│  │  Tickets   │  │
│  ├────────────┤  │
│  │Notificat'ns│  │
│  └────────────┘  │
└──────────────────┘
```

## Service Details

### 1. Spring Boot API (Backend)

**Port:** 8080
**Language:** Java 21
**Framework:** Spring Boot 3.3

**Modules:**
- **Auth** — User registration, login, JWT token management, role-based access
- **Event** — Event CRUD, seat map generation, section management, publishing
- **Booking** — Seat hold with Redis lock, payment processing, cancellation, expiration scheduling
- **Ticket** — QR code generation, check-in validation, ticket lifecycle
- **Payment** — Mock payment processor (future: Stripe/payment gateway integration)

**Key Patterns:**
- Spring Data JPA with PostgreSQL
- Spring Security with JWT
- Spring Scheduler for booking expiration
- Kafka Producer for event publishing
- Redisson for distributed locking

### 2. Node.js Notification Service

**Port:** 3001
**Language:** Node.js 22
**Framework:** Fastify

**Modules:**
- **Kafka Consumer** — Subscribes to booking.events, ticket.events topics
- **WebSocket Server** — Real-time push to connected clients
- **Notification Store** — Persists notifications, tracks read/unread
- **Push Delivery** — Email, SMS, push notification adapters

### 3. Infrastructure

| Component | Version | Purpose |
|---|---|---|
| PostgreSQL | 16 | Primary data store |
| Redis | 7 | Distributed locks, caching, sessions |
| Apache Kafka | 3.7 (KRaft) | Async event streaming between services |

## Tech Choices & Rationale

### Why Spring Boot for Booking?
- Strong transactional support with `@Transactional`
- Mature ecosystem for security (Spring Security), data (JPA), scheduling
- Excellent PostgreSQL support with optimistic/pessimistic locking
- Well-suited for complex business logic (booking state machines)

### Why Node.js for Notifications?
- Native WebSocket support with excellent concurrency model
- Fastify is one of the fastest Node.js frameworks
- Easy Kafka integration with kafkajs
- Lightweight — notifications don't need heavy JVM overhead

### Why Kafka over Redpanda?
- Broader ecosystem support and documentation
- KRaft mode eliminates ZooKeeper dependency
- Well-tested in production at scale
- Better tooling for monitoring and debugging

### Why Redis + PostgreSQL Dual Protection?
- **Redis SET NX EX** — Fast, atomic distributed lock with automatic TTL expiry
- **PostgreSQL UNIQUE constraint** — Database-level guarantee that survives Redis failures
- **Idempotency key** — Prevents duplicate processing on retries
- Together, they provide defense-in-depth against double-booking

## Data Flow: Booking a Seat

```
Client                    Backend                   Redis           PostgreSQL        Kafka
  │                         │                         │                 │                │
  │ POST /bookings/hold     │                         │                 │                │
  │────────────────────────▶│                         │                 │                │
  │                         │ SET seat:lock:{id} NX   │                 │                │
  │                         │────────────────────────▶│                 │                │
  │                         │    ✓ Lock acquired      │                 │                │
  │                         │◀────────────────────────│                 │                │
  │                         │                         │                 │                │
  │                         │ INSERT booking          │                 │                │
  │                         │────────────────────────────────────────▶│                │
  │                         │    ✓ Unique constraint OK                │                │
  │                         │◀────────────────────────────────────────│                │
  │                         │                         │                 │                │
  │                         │ PUBLISH BOOKING_HELD    │                 │                │
  │                         │────────────────────────────────────────────────────────▶│
  │                         │                         │                 │                │
  │  201 Created            │                         │                 │                │
  │◀────────────────────────│                         │                 │                │
```

## Non-Goals (Current Phase)

- Frontend implementation (planned for Phase 2)
- Payment gateway integration (mock only)
- Multi-region deployment
- Admin dashboard
- Analytics/reporting
