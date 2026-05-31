# SeatGuard — Final Evidence Report

**Branch:** `feature/backend-google-oauth-admin-rbac`
**Date:** 2026-05-31
**Status:** Portfolio/Demo-grade

## 1. Project Summary
SeatGuard is a high-concurrency ticket booking platform built as a portfolio project. It demonstrates microservices architecture, event-driven design with Kafka, distributed locking with Redis, and payment provider integration. The core problem it solves: prevent double-booking under concurrent traffic.

## 2. Architecture Summary
- 6 backend microservices (Spring Boot + NestJS) + 1 Next.js frontend
- API Gateway (Spring Cloud Gateway) as single entry point
- PostgreSQL (5 databases, shared instance), Redis (distributed locks), Apache Kafka 3.7 KRaft (event bus)
- All inter-service communication through Gateway (synchronous) or Kafka (asynchronous)

## 3. Public Demo URL
- Frontend: http://206.189.47.198:3001
- API Gateway: http://206.189.47.198:8080

## 4. Services and Ports
| Service | Port | Tech |
|---------|------|------|
| api-gateway | 8080 | Spring Cloud Gateway |
| auth-service | 8081 | Spring Boot + JWT + OAuth2 |
| event-service | 8082 | Spring Boot + JPA |
| booking-service | 8083 | Spring Boot + Redis + Kafka |
| ticket-service | 8084 | Spring Boot + Kafka |
| notification-service | 3000 | NestJS + Kafka + WebSocket |
| frontend | 3001 | Next.js 14 |

## 5. Gateway-Only API Architecture
- Frontend ONLY calls API Gateway (port 8080)
- No direct service-to-service HTTP calls except through Gateway
- Gateway handles routing, CORS, rate limiting, JWT filter

## 6. Auth / OAuth / RBAC Evidence
- JWT authentication on all protected endpoints
- Google OAuth2: "Continue with Google" button → /oauth2/authorization/google → callback → JWT
- Admin RBAC: @PreAuthorize("hasRole('ADMIN')") on event create/update/publish
- USER role: 403 Forbidden when trying to create event
- ADMIN role: 201 Created on event creation
- Evidence: reports/final-report-oauth-rbac.md

## 7. Admin Event Management Evidence
- Only ADMIN can create, update, publish events
- Only ADMIN can upload event images (Cloudinary)
- USER can only browse, book, pay, view tickets
- Cloudinary image upload: JPEG/PNG/WebP, max 5MB

## 8. Cloudinary Upload Evidence
- CloudinaryService handles upload via Cloudinary HTTP44 SDK
- Images stored in Cloudinary cloud, URL saved to event record
- Config: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (from .env, not committed)
- Commit: cbb639f

## 9. Booking / Payment Flow Evidence
- User selects seat → POST /api/bookings/hold → Redis lock + DB check → PENDING_PAYMENT
- User pays → POST /api/bookings/{id}/pay → CONFIRMED
- Payment providers:
  - MOCK: Active, full demo flow (create → confirm → ticket)
  - MoMo: Backend adapter exists as future sandbox extension, hidden from demo UI
  - VNPay: Backend adapter exists as future sandbox extension, hidden from demo UI
- Commit: 009683d, 6f7237c

## 10. Kafka Booking → Ticket Evidence
- Booking confirmed → Kafka BOOKING_CONFIRMED event
- Ticket Service consumes → generates ticket with QR code
- Ticket status: VALID
- Notification Service consumes → WebSocket push

## 11. Ticket Check-in + Duplicate Rejection Evidence
- Check-in: POST /api/tickets/{id}/checkin → status USED
- Duplicate check-in: rejected with appropriate error
- QR code on each ticket for validation

## 12. k6 Double-Booking Evidence
- Test: 100 VUs, 30s, same seat
- Result: 14,374 total requests, exactly 1 successful booking
- 14,364 conflicts (409), 0 unexpected errors
- DB verification: 0 duplicate bookings
- p95 latency: 427ms
- Evidence: reports/k6-double-booking.md

## 13. Docker Health Evidence
- Docker Compose manages all 10 services (postgres, redis, kafka, 5 backend, notification, frontend)
- Healthchecks on all infrastructure services
- Notification service: fixed healthcheck (node fetch instead of curl), Kafka retry logic
- Commit: ad2affc

## 14. Payment Provider Status
| Provider | Status | Notes |
|----------|--------|-------|
| MOCK | Active | Full demo flow, no external dependencies |
| MoMo | Backend-only | Provider adapter as future sandbox extension, hidden from demo UI |
| VNPay | Backend-only | Provider adapter as future sandbox extension, hidden from demo UI |

**Important:** The public demo UI shows only the Mock payment option. MoMo/VNPay backend adapters remain in the codebase as extensibility examples. Real integration requires merchant credentials and signature verification (TODO in code).

## 15. Known Limitations
1. MoMo/VNPay are backend-only provider adapters — hidden from demo UI, no real payment signing
2. Notification service is demo-grade, not production email/SMS provider
3. No CI/CD pipeline
4. No production deployment (demo on single VPS)
5. No rate limiting configuration (Gateway has defaults)
6. No monitoring/observability stack (Prometheus/Grafana)

## 16. How to Demo
1. Open http://206.189.47.198:3001
2. Login (demo credentials or Google OAuth)
3. Browse events (Cloudinary images)
4. As ADMIN: create event, upload image
5. As USER: select seat → hold → pay (mock) → ticket issued
6. Check-in ticket → duplicate check-in rejected
7. Show /proof for technical evidence
8. Show k6 report for concurrency proof
