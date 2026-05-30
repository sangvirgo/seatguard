# Roadmap

## Project Phases

### Phase 1: Project Setup ✅
- [x] Directory structure
- [x] Git initialization
- [x] Project planning documentation

### Phase 2: Core Infrastructure ✅
- [x] Docker Compose (PostgreSQL, Redis, Kafka)
- [x] Project scaffolding

### Phase 3: Core Backend (Current)
**Goal:** Working booking flow with double-booking prevention.

- [ ] Spring Boot project setup with dependencies
- [ ] Database schema and migrations (Flyway)
- [ ] User authentication (register, login, JWT)
- [ ] Event CRUD and seat map management
- [ ] Seat hold with Redis distributed lock
- [ ] Booking flow (hold → pay → confirm)
- [ ] Booking expiration scheduler
- [ ] Kafka event publishing
- [ ] PostgreSQL unique active booking constraint
- [ ] Idempotency key support

**Deliverable:** API that handles concurrent seat booking with zero double-bookings.

---

### Phase 4: Notification Service
**Goal:** Real-time notifications for booking events.

- [ ] Node.js + Fastify project setup
- [ ] Kafka consumer for booking/ticket events
- [ ] WebSocket server for real-time push
- [ ] Notification storage and read/unread tracking
- [ ] REST API for notification history

**Deliverable:** Users receive real-time notifications for booking confirmations, expirations, and check-ins.

---

### Phase 5: Ticket System
**Goal:** QR-based ticketing and check-in flow.

- [ ] Ticket generation on booking confirmation
- [ ] QR code generation with HMAC signature
- [ ] Ticket list and detail endpoints
- [ ] Staff check-in endpoint
- [ ] QR code scanning/validation

**Deliverable:** Complete ticket lifecycle from issuance to venue check-in.

---

### Phase 6: Load Testing & Hardening
**Goal:** Prove system correctness under load.

- [ ] k6 double-booking test (1000 VUs)
- [ ] k6 concurrent event booking test
- [ ] k6 booking expiration test
- [ ] Performance benchmarking and optimization
- [ ] Error handling hardening
- [ ] Logging and observability setup

**Deliverable:** Passing load tests with documented performance characteristics.

---

### Phase 7: Frontend
**Goal:** User-facing booking interface.

- [ ] React/Next.js project setup
- [ ] Event listing and search
- [ ] Interactive seat map with real-time availability
- [ ] Booking flow (select seat → hold → pay)
- [ ] Ticket display with QR code
- [ ] User dashboard (bookings, tickets, notifications)
- [ ] Responsive design for mobile

**Deliverable:** Complete web application for end users.

---

### Phase 8: Admin Panel
**Goal:** Event management interface for organizers.

- [ ] Event creation and management
- [ ] Section and seat configuration
- [ ] Booking analytics and reporting
- [ ] Attendee list and check-in monitoring
- [ ] Revenue reports

**Deliverable:** Admin interface for event organizers.

---

### Phase 9: Production Readiness
**Goal:** Deploy and operate in production.

- [ ] Kubernetes deployment manifests
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring and alerting (Prometheus + Grafana)
- [ ] Log aggregation (ELK or similar)
- [ ] SSL/TLS configuration
- [ ] Database backup and recovery procedures
- [ ] Load balancer configuration
- [ ] Rate limiting and DDoS protection
- [ ] Security audit

**Deliverable:** Production-grade deployment with monitoring and alerting.

---

## Future Enhancements

### Short Term
- [ ] Multi-language support (i18n)
- [ ] Email/SMS notifications
- [ ] Payment gateway integration (Stripe, VNPay)
- [ ] Seat recommendation engine
- [ ] Waitlist for sold-out events

### Medium Term
- [ ] Mobile app (React Native)
- [ ] Social features (share events, invite friends)
- [ ] Loyalty program and discounts
- [ ] Multi-venue support
- [ ] API for third-party integrations

### Long Term
- [ ] Multi-region deployment
- [ ] AI-powered dynamic pricing
- [ ] Augmented reality seat preview
- [ ] Blockchain-based ticket verification
- [ ] Analytics dashboard for organizers

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|---|---|---|
| Phase 1-2 | ✅ Done | — |
| Phase 3 | 2-3 weeks | Phase 2 |
| Phase 4 | 1-2 weeks | Phase 3 |
| Phase 5 | 1-2 weeks | Phase 3 |
| Phase 6 | 1 week | Phase 3-5 |
| Phase 7 | 3-4 weeks | Phase 3-5 |
| Phase 8 | 2-3 weeks | Phase 7 |
| Phase 9 | 2-3 weeks | Phase 7-8 |

**Total estimated time to production:** 12-18 weeks (solo developer), 6-10 weeks (small team).

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2024-01 | Spring Boot for backend | Strong transactional support, mature ecosystem |
| 2024-01 | Node.js for notifications | Lightweight, excellent WebSocket support |
| 2024-01 | Kafka over Redpanda | Broader ecosystem, KRaft mode available |
| 2024-01 | Redis + PostgreSQL dual protection | Defense-in-depth against double-booking |
| 2024-01 | UUID primary keys | Distributed ID generation, no sequence coordination |
| 2024-01 | Flyway for migrations | Version-controlled schema changes |
