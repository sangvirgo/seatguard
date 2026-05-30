# Roadmap

## Phase 1: Project Planning & Setup ✅
**Duration:** Week 1
**Branch:** `feature/seatguard-initial-setup`

- [x] Environment assessment
- [x] Project structure creation
- [x] Architecture documentation
- [x] API contract definition
- [x] Database design
- [x] Event flow design
- [x] Testing strategy
- [x] Docker Compose skeleton
- [x] Agent workflow rules (AGENTS.md)
- [x] Git setup and initial commit

---

## Phase 2: Service Scaffolding
**Duration:** Week 2
**Branch:** `feature/seatguard-scaffold-services`

- [ ] Spring Boot parent POM (multi-module)
- [ ] Auth Service skeleton (controllers, services, repositories)
- [ ] Event Service skeleton
- [ ] Booking Service skeleton
- [ ] Ticket Service skeleton
- [ ] API Gateway (Spring Cloud Gateway) skeleton
- [ ] NestJS Notification Service skeleton
- [ ] Next.js Frontend skeleton
- [ ] Shared DTOs / API models
- [ ] Health check endpoints for all services

---

## Phase 3: Auth & User Management
**Duration:** Week 3
**Branch:** `feature/seatguard-auth`

- [ ] User registration with password hashing (BCrypt)
- [ ] Login with JWT access + refresh tokens
- [ ] Token refresh mechanism
- [ ] Role-based access control (USER, ADMIN, STAFF)
- [ ] Auth middleware / gateway filter
- [ ] Integration tests for auth flow

---

## Phase 4: Event & Seat Management
**Duration:** Week 4
**Branch:** `feature/seatguard-events`

- [ ] Event CRUD (create, update, publish, cancel)
- [ ] Section management
- [ ] Auto-generate seats per section
- [ ] Seat map query with real-time availability
- [ ] Event search and filtering
- [ ] Admin dashboard for event management

---

## Phase 5: Booking Engine (Core)
**Duration:** Weeks 5-6
**Branch:** `feature/seatguard-booking`

- [ ] Redis distributed lock (SET NX EX)
- [ ] Seat hold with TTL
- [ ] PostgreSQL unique active booking constraint
- [ ] Idempotency key implementation
- [ ] Payment mock (simulate success/failure)
- [ ] Booking expiry scheduled task
- [ ] Kafka event publishing (all booking events)
- [ ] **k6 double-booking test** — 1000 VUs, verify zero double-booking
- [ ] Performance optimization (p95 < 200ms)

---

## Phase 6: Ticket & Check-in
**Duration:** Week 7
**Branch:** `feature/seatguard-tickets`

- [ ] Auto-issue ticket on booking confirmation (Kafka consumer)
- [ ] QR code generation (ZXing library)
- [ ] Check-in by ticket ID
- [ ] Check-in by QR code / check-in code
- [ ] Ticket status management (VALID → USED → CANCELLED)
- [ ] Staff check-in interface

---

## Phase 7: Notifications
**Duration:** Week 8
**Branch:** `feature/seatguard-notifications`

- [ ] Kafka consumer for all event types
- [ ] Notification persistence (database)
- [ ] WebSocket push to connected clients
- [ ] Mark as read
- [ ] Notification preferences (future)
- [ ] Email notifications (future)

---

## Phase 8: Frontend
**Duration:** Weeks 9-10
**Branch:** `feature/seatguard-frontend`

- [ ] Landing page / event listing
- [ ] Event detail page with seat map
- [ ] Interactive seat selection (click to hold)
- [ ] Booking flow (hold → payment → confirmation)
- [ ] My bookings / My tickets pages
- [ ] QR ticket display
- [ ] Real-time notifications (WebSocket)
- [ ] Responsive design (mobile-first)

---

## Phase 9: Integration & Testing
**Duration:** Week 11
**Branch:** `feature/seatguard-testing`

- [ ] Full E2E test suite
- [ ] Load testing (k6) — 1000+ concurrent users
- [ ] Performance tuning
- [ ] Security audit (OWASP top 10)
- [ ] API documentation (Swagger/OpenAPI)

---

## Phase 10: Deployment & Launch
**Duration:** Week 12
**Branch:** `feature/seatguard-deploy`

- [ ] Production Docker Compose
- [ ] Database migrations (Flyway)
- [ ] Monitoring & alerting (Prometheus + Grafana)
- [ ] Log aggregation (ELK or Loki)
- [ ] SSL/TLS setup
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Soft launch → Public launch

---

## Future Enhancements

- [ ] Seat recommendation engine
- [ ] Waitlist / queue system for sold-out events
- [ ] Multi-currency support
- [ ] Social login (Google, Facebook)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Resale / transfer tickets
- [ ] Loyalty program
