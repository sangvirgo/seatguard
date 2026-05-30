# API Smoke Test Report
**Date:** 2026-05-30
**Branch:** feature/seatguard-integration-hardening

## Results: 22/22 PASS

### Health Checks (6/6)
| Port | Service | Endpoint | Status |
|------|---------|----------|--------|
| 8080 | api-gateway | /actuator/health | ✅ UP |
| 8081 | auth-service | /actuator/health | ✅ UP (DB) |
| 8082 | event-service | /actuator/health | ✅ UP (DB) |
| 8083 | booking-service | /actuator/health | ✅ UP (DB+Redis) |
| 8084 | ticket-service | /actuator/health | ✅ UP (DB) |
| 3000 | notification-service | /health | ✅ ok |

### Auth Flow (3/3)
| Step | Endpoint | Method | Status | Response |
|------|----------|--------|--------|----------|
| Register | /api/auth/register | POST | ✅ 200 | Returns JWT (auto-login) |
| Login | /api/auth/login | POST | ✅ 200 | accessToken + refreshToken |
| Profile | /api/auth/me | GET | ✅ 200 | id, email, fullName, phone, role |

### Event Flow (5/5)
| Step | Endpoint | Method | Status | Response |
|------|----------|--------|--------|----------|
| Create | /api/events | POST | ✅ 201 | eventId, status=DRAFT |
| Add section | /api/events/{id}/sections | POST | ✅ 201 | sectionId, price, capacity |
| Generate seats | /api/events/{id}/seats/generate | POST | ✅ 200 | 50 seats created |
| Publish | /api/events/{id}/publish | POST | ✅ 200 | status=PUBLISHED |
| Seat map | /api/events/{id}/seat-map | GET | ✅ 200 | sections with seat list |

### Booking Flow (3/3)
| Step | Endpoint | Method | Status | Response |
|------|----------|--------|--------|----------|
| Hold seat | /api/bookings/hold | POST | ✅ 201 | bookingId, PENDING_PAYMENT |
| Duplicate hold | /api/bookings/hold (same seat) | POST | ✅ 409 | SEAT_NOT_AVAILABLE |
| Pay | /api/bookings/{id}/pay | POST | ✅ 200 | status=CONFIRMED |

### Ticket Flow (4/4)
| Step | Endpoint | Method | Status | Response |
|------|----------|--------|--------|----------|
| Auto-issue (Kafka) | — | — | ✅ | BOOKING_CONFIRMED → ticket created |
| Get tickets | /api/tickets/me | GET | ✅ 200 | ticketId, checkInCode |
| Check-in | /api/tickets/{id}/check-in | POST | ✅ 200 | status=USED |
| Duplicate check-in | /api/tickets/{id}/check-in | POST | ✅ 400 | TICKET_ALREADY_USED |

### Notification (1/1)
| Step | Endpoint | Status |
|------|----------|--------|
| Health | /health | ✅ ok |

## Kafka Event Evidence
```
# booking-service log:
Published BOOKING_CONFIRMED for booking b883c360... to topic booking-events

# ticket-service log:
Received Kafka event: BOOKING_CONFIRMED
Ticket issued: id=363aff87..., bookingId=b883c360..., checkInCode=SG-QXLGF151
```

## Full Flow Script
```bash
bash /root/projects/seatguard/tests/smoke/full-flow.sh
# Result: 22 PASS / 0 FAIL
```
