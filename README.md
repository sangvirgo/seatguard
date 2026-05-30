# 🎫 SeatGuard

**Real-time event/concert ticket booking platform with guaranteed double-booking prevention.**

SeatGuard is a distributed microservices system for event ticketing that combines Redis distributed locks, PostgreSQL constraints, and Kafka event streaming to ensure every seat is sold exactly once — even under extreme concurrent load.

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Spring Boot 3.3 (Java 21) — booking, payment, seat-locking, auth |
| **Notification Service** | Node.js 22 (Fastify) — Kafka consumer, WebSocket, push notifications |
| **Database** | PostgreSQL 16 — persistent storage with unique constraints |
| **Cache / Lock** | Redis 7 — distributed seat locks (SET NX EX), idempotency keys |
| **Message Broker** | Apache Kafka 3.7 (KRaft mode) — async event streaming |
| **Load Testing** | k6 — concurrent double-booking validation |
| **Container** | Docker & Docker Compose |

## 🚀 Quick Start

### Prerequisites

- Java 21+
- Node.js 22+
- Docker & Docker Compose
- k6 (for load testing)

### 1. Start Infrastructure

```bash
cd infra
docker compose up -d
```

This starts PostgreSQL, Redis, and Kafka in KRaft mode.

### 2. Run Backend (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
```

### 3. Run Notification Service (Node.js)

```bash
cd notification-service
npm install
npm run dev
```

### 4. Run Double-Booking Test

```bash
k6 run tests/k6/double-booking.js
```

## 📁 Project Structure

```
seatguard/
├── backend/                    # Spring Boot monolith (booking, payment, auth, events)
│   ├── src/
│   └── pom.xml
├── notification-service/       # Node.js notification service
│   ├── src/
│   └── package.json
├── frontend/                   # Frontend (future)
├── docs/                       # Documentation
│   ├── architecture.md
│   ├── api-contract.md
│   ├── database-design.md
│   ├── event-flow.md
│   ├── testing-strategy.md
│   └── roadmap.md
├── infra/                      # Infrastructure
│   └── docker-compose.yml
├── tests/                      # Load & integration tests
│   └── k6/
│       └── double-booking.js
├── AGENTS.md                   # Agent workflow rules
└── README.md
```

## 🔒 Double-Booking Protection Strategy

SeatGuard uses a **three-layer defense** to prevent double-booking:

1. **Redis Distributed Lock** — `SET seat:lock:{seatId} {bookingId} NX EX 300` — atomic lock with 5-minute TTL
2. **PostgreSQL Unique Constraint** — `UNIQUE(seat_id, status)` on active bookings (PENDING_PAYMENT, CONFIRMED) — database-level guarantee
3. **Idempotency Key** — Client-generated request ID prevents duplicate processing

If any layer catches a conflict, the booking is rejected with `409 Conflict`.

## 📖 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Contract](docs/api-contract.md)
- [Database Design](docs/database-design.md)
- [Event Flow](docs/event-flow.md)
- [Testing Strategy](docs/testing-strategy.md)
- [Roadmap](docs/roadmap.md)

## 📄 License

MIT
