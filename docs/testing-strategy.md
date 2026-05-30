# Testing Strategy

## Overview

SeatGuard employs a multi-layered testing strategy to ensure correctness, especially for the critical double-booking scenario.

---

## 1. Unit Tests

### Scope
- Service layer logic
- Utility functions
- State machine transitions
- Validation logic

### Framework
- **Java:** JUnit 5 + Mockito
- **NestJS:** Jest

### Key Areas
- Booking state transitions (PENDING_PAYMENT → CONFIRMED, EXPIRED, CANCELLED)
- Ticket status transitions (VALID → USED, CANCELLED)
- Idempotency key validation
- Date/time calculations (expiry TTL)

### Coverage Target
- Minimum 80% line coverage
- 100% coverage on booking/payment/seat-locking logic

---

## 2. Integration Tests

### Scope
- Database operations (Repository/DAO layer)
- Redis lock acquisition and release
- Kafka producer/consumer communication
- API endpoint request/response

### Framework
- **Java:** Spring Boot Test + Testcontainers
- **NestJS:** Supertest + Jest

### Testcontainers Setup
```java
@SpringBootTest
@Testcontainers
class BookingServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7").withExposedPorts(6379);

    @Container
    static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.0"));
}
```

### Key Integration Tests
- **Booking flow:** Hold seat → Pay → Confirm → Issue ticket
- **Expiry flow:** Hold seat → Wait TTL → Auto-expire
- **Concurrent hold:** Two users try same seat → one succeeds
- **Kafka event delivery:** Booking confirmed → ticket issued → notification sent
- **Idempotency:** Same idempotency key → same booking returned

---

## 3. End-to-End (E2E) Tests

### Scope
- Full user journey through API
- Cross-service communication
- Real infrastructure (Docker Compose)

### Framework
- REST-assured (Java) or Supertest (Node.js)
- Docker Compose test environment

### Test Scenarios
1. Register → Login → Browse events → Select seat → Hold → Pay → Get ticket → Check-in
2. Register → Login → Hold seat → Expire → Re-hold same seat
3. Register → Login → Hold seat → Cancel → Verify seat available again

---

## 4. Load / Concurrency Tests (k6)

### Critical Test: Double-Booking Prevention

**Objective:** Verify that when 1000 concurrent users attempt to book the **same seat**, exactly **1 succeeds** and **999 fail**.

**Script:** `tests/k6/double-booking.js`

**Scenario:**
```
1. Setup: Create test event, section, seat via API
2. Create 1000 user tokens (pre-seeded or batch register)
3. Ramp: 0 → 1000 VUs in 10 seconds
4. Each VU: POST /api/bookings/hold with same eventId + seatId
5. Assertions:
   - http_req_failed < 1% (except 409 Conflict)
   - Exactly 1 booking with status PENDING_PAYMENT
   - 0 bookings with status CONFIRMED (not paid yet)
   - No duplicate active bookings in database
6. Teardown: Verify DB state, clean up
```

**Success Criteria:**
- Exactly 1 HTTP 201 (booking created)
- Exactly 999 HTTP 409 (seat not available)
- Database: 1 active booking for that seat
- Redis: 1 lock key for that seat
- No race condition artifacts

### Performance Benchmarks
| Metric | Target |
|--------|--------|
| Booking hold latency (p95) | < 200ms |
| Booking hold latency (p99) | < 500ms |
| Throughput (holds/sec) | > 500 |
| Error rate (non-conflict) | < 0.1% |

---

## 5. Contract Tests

### Scope
- API request/response schemas
- Kafka event schemas
- Backward compatibility

### Framework
- Pact (consumer-driven contract tests)
- JSON Schema validation

---

## 6. Test Data Management

### Seed Data
- Test users (admin, staff, regular users)
- Test events with sections and seats
- Pre-generated JWT tokens for load tests

### Test Isolation
- Each test suite gets a clean database (Testcontainers or separate schema)
- Redis flushed between test runs
- Kafka topics cleared

---

## 7. CI/CD Integration

### Pipeline Stages
```
1. Lint & Format Check
2. Unit Tests (< 2 min)
3. Integration Tests (< 5 min, requires Docker)
4. Build Docker images
5. Deploy to staging
6. E2E Tests (< 10 min)
7. Load Tests (on-demand, manual trigger)
8. Deploy to production (manual approval)
```

### Tools
- GitHub Actions for CI
- Docker Compose for local test environment
- k6 Cloud for distributed load testing (optional)

---

## Test Directory Structure

```
tests/
├── k6/
│   ├── double-booking.js       # Critical concurrency test
│   ├── load-test.js            # General load test
│   └── helpers/
│       └── auth.js             # Token generation helpers
├── postman/
│   ├── SeatGuard.postman_collection.json
│   └── environments/
│       ├── local.json
│       └── staging.json
└── e2e/
    ├── booking-flow.test.js
    └── checkin-flow.test.js
```
