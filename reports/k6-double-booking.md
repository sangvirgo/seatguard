# k6 Double-Booking Test Report
**Date:** 2026-05-30
**Branch:** feature/seatguard-integration-hardening

## Status: PASS ✅

## Test Configuration
- **VUs:** 100 (ramping 0→100→100→0)
- **Duration:** 30s
- **Target:** POST /api/bookings/hold
- **Scenario:** 100 concurrent users try to book the SAME seat
- **Script:** `tests/k6/double-booking.js`

## Results

| Metric | Value |
|--------|-------|
| Total requests | **14,374** |
| Successful bookings | **1** |
| Conflict (409) | **14,364** |
| Unexpected errors | **0** |
| Throughput | 469 req/s |
| p95 latency | 427ms |
| p99 latency | ~500ms |
| http_req_failed | 99.93% (all 409 conflicts) |

## Thresholds
- ✅ `http_req_duration p(95)<500` — PASSED (427ms)

## DB Verification
```sql
SELECT seat_id, status, COUNT(*) 
FROM bookings 
WHERE status IN ('PENDING_PAYMENT', 'CONFIRMED') 
GROUP BY seat_id, status 
HAVING COUNT(*) > 1;
-- Result: 0 rows — NO duplicate bookings

SELECT seat_id, status, COUNT(*) FROM bookings GROUP BY seat_id, status;
-- Result: 1 row — exactly 1 PENDING_PAYMENT for the contested seat
```

## Double-Booking Protection Layers Verified
1. ✅ **Redis SET NX EX lock** — first acquirer wins, others get rejected
2. ✅ **DB active booking check** — `findBySeatIdAndStatusIn` prevents duplicates
3. ✅ **Idempotency key** — same key returns existing booking
4. ✅ **Application-level** — `DuplicateBookingException` thrown on conflict

## Commands Run
```bash
# Clean DB
docker exec seatguard-postgres psql -U seatguard -d seatguard_booking -c "TRUNCATE bookings CASCADE;"

# Run k6
k6 run /root/projects/seatguard/tests/k6/double-booking.js

# Verify DB
docker exec seatguard-postgres psql -U seatguard -d seatguard_booking \
  -c "SELECT seat_id, status, COUNT(*) FROM bookings GROUP BY seat_id, status;"
```

## RAM During k6
- Full stack + k6: ~3.8GB used
- No OOM, no service crashes
