# SeatGuard

High-Concurrency Ticket Booking Platform

## Overview

SeatGuard is a production-grade event/concert ticket booking platform designed to handle high-concurrency scenarios. The system ensures **zero double-booking** through a combination of Redis distributed locks and PostgreSQL unique constraints.

## Key Features

- **Event & Seat Map Management** — Create events, define sections/seats, publish
- **Real-Time Seat Holding** — Redis-based TTL locks for seat reservation
- **Payment Flow** — Mock payment integration with confirmation/expiry
- **QR Ticket Generation** — Unique QR codes per ticket for check-in
- **Concurrent Safety** — Tested with 1000+ simultaneous booking attempts
- **Push Notifications** — WebSocket + Kafka-based event notifications

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Services | Java 21 + Spring Boot 3.x |
| Notification Service | Node.js + NestJS |
| Frontend | React + Next.js 14 |
| Database | PostgreSQL 16 |
| Cache / Lock | Redis 7 |
| Message Broker | Apache Kafka 3.7 (KRaft mode) |
| API Gateway | Spring Cloud Gateway |
| Load Testing | k6 |
| Containerization | Docker Compose |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend   │────▶│ API Gateway  │────▶│  Auth Service   │
│  (Next.js)   │     │ (Spring Cloud)│     │  (Spring Boot)  │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
     ┌─────────────┐ ┌──────────┐ ┌──────────────┐
     │Event Service│ │ Booking  │ │Ticket Service│
     │(Spring Boot)│ │ Service  │ │(Spring Boot) │
     └─────────────┘ └──────────┘ └──────────────┘
                           │
                     ┌─────┴─────┐
                     ▼           ▼
                ┌────────┐  ┌─────────┐
                │ Redis  │  │ Kafka   │
                │ (Lock) │  │ (Event) │
                └────────┘  └────┬────┘
                                 ▼
                        ┌─────────────────┐
                        │ Notification Svc│
                        │   (NestJS)      │
                        └─────────────────┘
```

## Services

| Service | Port | Responsibility |
|---------|------|---------------|
| api-gateway | 8080 | Routing, rate limiting, auth filter |
| auth-service | 8081 | Register, login, JWT, refresh tokens |
| event-service | 8082 | Events, sections, seats, seat map |
| booking-service | 8083 | Hold seat, payment, cancellation |
| ticket-service | 8084 | Ticket issuance, QR, check-in |
| notification-service | 3000 | WebSocket push, Kafka consumer |
| frontend | 3001 | Next.js web app |

## Quick Start

```bash
# Start infrastructure
cd infra && docker-compose up -d

# Start backend services (each in separate terminal)
cd backend/auth-service && ./mvnw spring-boot:run
cd backend/event-service && ./mvnw spring-boot:run
cd backend/booking-service && ./mvnw spring-boot:run
cd backend/ticket-service && ./mvnw spring-boot:run

# Start notification service
cd notification-service && npm run start:dev

# Start frontend
cd frontend && npm run dev
```

## Double-Booking Protection

SeatGuard uses a **dual-layer protection** strategy:

1. **Redis SET NX EX** — Distributed lock with TTL (e.g., 5 minutes)
2. **PostgreSQL UNIQUE constraint** — Active booking per seat enforcement
3. **Idempotency Key** — Prevents duplicate booking requests
4. **Transaction Boundary** — Atomic DB operations

Load test: `k6 run tests/k6/double-booking.js` — 1000 VUs, 1 seat, expect exactly 1 success.

## Documentation

- [Architecture](docs/architecture.md)
- [API Contract](docs/api-contract.md)
- [Database Design](docs/database-design.md)
- [Event Flow](docs/event-flow.md)
- [Testing Strategy](docs/testing-strategy.md)
- [Roadmap](docs/roadmap.md)
- [Agent Workflow](AGENTS.md)

## License

Private — All rights reserved.
