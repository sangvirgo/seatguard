# k6 Double-Booking Test Report
**Date:** 2026-05-30
**Branch:** feature/seatguard-full-integration-test

## Status: NOT RUN

### Reason
k6 is not installed on the server. The existing `tests/k6/double-booking.js` is a placeholder script.

### Blockers Before k6 Can Run
1. **Install k6** — `apt install k6` or from official repo
2. **JWT token generation** — k6 needs pre-generated tokens for 1000 VUs
3. **API Gateway routing** — Currently services are accessed directly, not through gateway
4. **Kafka event flow** — booking→ticket pipeline needs to work for full validation

### What Would Be Tested
- 1000 VUs simultaneously POST /api/bookings/hold for same seat
- Expected: exactly 1 success (201), 999 conflicts (409)
- DB verification: no duplicate active bookings

### Current Double-Booking Protection (verified via manual test)
- ✅ Redis SET NX EX lock works (manual duplicate hold returned 409)
- ✅ DB duplicate check works (booking service checks active bookings)
- ⚠️ Idempotency key works (same key returns existing booking)
- ❌ PostgreSQL unique constraint on (seat_id, status) not yet verified with concurrent load

### Recommended Next Steps
1. Install k6: `curl -s https://dl.k6.io/key.gpg | apt-key add && echo "deb https://dl.k6.io/deb stable main" > /etc/apt/sources.list.d/k6.list && apt update && apt install k6`
2. Generate test tokens
3. Update k6 script with real endpoints
4. Run: `k6 run tests/k6/double-booking.js`
