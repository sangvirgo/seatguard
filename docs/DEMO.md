# SeatGuard — Demo Guide

## What is SeatGuard?

SeatGuard is a **high-concurrency ticket booking platform** built as a portfolio/showcase project. It demonstrates real-world architecture patterns including microservices, event-driven design, distributed locking, and payment provider integration.

## Architecture

```
Browser → Next.js Frontend (3001)
  → /api/** → API Gateway (8080)
    → Auth Service (8081)    — JWT auth, Google OAuth, RBAC
    → Event Service (8082)   — Events, sections, seats, Cloudinary images
    → Booking Service (8083) — Seat hold, Redis lock, payments, Kafka producer
    → Ticket Service (8084)  — Kafka consumer, ticket issuance, check-in
    → Notification Service (3000) — Kafka consumer, WebSocket push
```

**Infrastructure:** PostgreSQL (5 databases), Redis (distributed lock), Kafka (event bus)

## Core Flow

```
1. Browse events (public)
2. Admin creates event + sections + seats → Publish
3. Admin uploads event image via Cloudinary
4. User selects seat → Hold (Redis lock + PENDING_PAYMENT)
5. User chooses payment method (Mock / MoMo / VNPay)
6. Payment confirmed → Booking CONFIRMED
7. Kafka BOOKING_CONFIRMED → Ticket Service issues ticket
8. Ticket check-in → QR code validation
9. Duplicate check-in → Rejected
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| API Gateway | Spring Cloud Gateway |
| Auth | Spring Boot, JWT, Google OAuth2, BCrypt |
| Events | Spring Boot, JPA, Cloudinary SDK |
| Booking | Spring Boot, Redis, Kafka, JPA |
| Tickets | Spring Boot, JPA, Kafka consumer |
| Notifications | NestJS, KafkaJS, Socket.IO |
| Database | PostgreSQL 16 |
| Cache/Lock | Redis 7 |
| Message Bus | Apache Kafka 3.7 (KRaft) |
| Load Test | k6 |

## Security

- **JWT Authentication** — All protected endpoints require Bearer token
- **Google OAuth2** — "Continue with Google" login flow
- **ADMIN RBAC** — Only ADMIN can create/update/publish events and upload images
- **USER role** — Can browse events, hold seats, pay, view tickets
- **Gateway-only architecture** — Frontend never calls services directly
- **Secrets in .env only** — Never committed to source

## Payment System

| Provider | Status | Description |
|----------|--------|-------------|
| **MOCK** | ✅ Active | Full demo flow: create → confirm → booking confirmed → ticket |
| **MoMo** | 🔧 Sandbox-ready | Returns "not configured" when disabled; needs merchant credentials + HMAC signing |
| **VNPay** | 🔧 Sandbox-ready | Returns "not configured" when disabled; needs merchant credentials + hash signing |

**Note:** MoMo/VNPay are provider options with clean architecture. Real payment requires sandbox merchant credentials and signature verification, which are not implemented (TODO markers in code).

## Concurrency Proof

**k6 double-booking test** (100 concurrent VUs, same seat):
- ✅ Exactly **1 successful booking**
- ✅ **4352 conflicts** (correctly rejected)
- ✅ **0 duplicate bookings** in database

## Public Demo

**URL:** http://206.189.47.198:3001

## Environment

- `.env.example` — All required variables with placeholders
- `.env` — Real values (not committed)
- Docker Compose manages all services

## Key Evidence Pages

- `/proof` — Technical build/test evidence
- `/events` — Event listing with Cloudinary images
- `/tickets` — Issued tickets with QR codes
