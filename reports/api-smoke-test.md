# API Smoke Test Report
**Date:** 2026-05-30
**Branch:** feature/seatguard-full-integration-test

## Results: 16 PASS / 3 FAIL

### Health Checks (6 tests)
| Port | Service | Status |
|------|---------|--------|
| 8080 | api-gateway | ✅ UP |
| 8081 | auth-service | ✅ UP |
| 8082 | event-service | ✅ UP |
| 8083 | booking-service | ✅ UP |
| 8084 | ticket-service | ✅ UP |
| 3000 | notification-service | ❌ `/actuator/health` returns 404 (NestJS uses `/health`) |

### Auth Flow
| Step | Endpoint | Expected | Actual | Status |
|------|----------|----------|--------|--------|
| Register | POST /api/auth/register | 201 | 200 (auto-login) | ⚠️ Design choice |
| Login | POST /api/auth/login | 200 | 200 + JWT | ✅ |
| Profile | GET /api/auth/me | 200 | Blocked by Spring Security | ❌ Gap |

### Event Flow
| Step | Endpoint | Expected | Actual | Status |
|------|----------|----------|--------|--------|
| Create | POST /api/events | 201 | 201 | ✅ |
| Add section | POST /api/events/{id}/sections | 201 | 201 | ✅ |
| Generate seats | POST /api/events/{id}/seats/generate | 200 | 200 (50 seats) | ✅ |
| Publish | POST /api/events/{id}/publish | 200 | 200 | ✅ |
| Seat map | GET /api/events/{id}/seat-map | 200 | 200 | ✅ |

### Booking Flow
| Step | Endpoint | Expected | Actual | Status |
|------|----------|----------|--------|--------|
| Hold seat | POST /api/bookings/hold | 201 | 201 | ✅ |
| Duplicate hold | POST /api/bookings/hold (same seat) | 409 | 409 | ✅ |
| Pay | POST /api/bookings/{id}/pay | 200 | 200 (CONFIRMED) | ✅ |

### Ticket Flow
| Step | Endpoint | Expected | Actual | Status |
|------|----------|----------|--------|--------|
| Auto-issue via Kafka | — | Ticket created | ❌ Not propagated | ❌ Kafka gap |
| Get tickets | GET /api/tickets/me | 200 | 200 (empty) | ✅ API works |

## Identified Gaps
1. **Spring Security blocks /api/auth/me** — SecurityConfig doesn't properly permit authenticated endpoints
2. **Kafka event propagation** — booking→ticket Kafka events not flowing (producer/consumer config mismatch)
3. **Register returns 200** instead of 201 (returns tokens immediately = auto-login design)
4. **Notification service** health at `/health` not `/actuator/health`
