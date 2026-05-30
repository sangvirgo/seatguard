#!/bin/bash
# Run SeatGuard k6 double-booking load test
set -e
cd "$(dirname "$0")/.."
echo "Running k6 double-booking test..."
echo "Make sure infra and backend services are running first."
echo ""

# Clean DB for fresh test
docker exec seatguard-postgres psql -U seatguard -d seatguard_booking -c "TRUNCATE bookings CASCADE;" 2>/dev/null || true
docker exec seatguard-postgres psql -U seatguard -d seatguard_event -c "TRUNCATE events CASCADE; TRUNCATE sections CASCADE; TRUNCATE seats CASCADE;" 2>/dev/null || true

k6 run tests/k6/double-booking.js

echo ""
echo "Verifying DB (no duplicates)..."
docker exec seatguard-postgres psql -U seatguard -d seatguard_booking \
  -c "SELECT seat_id, status, COUNT(*) FROM bookings WHERE status IN ('PENDING_PAYMENT', 'CONFIRMED') GROUP BY seat_id, status HAVING COUNT(*) > 1;"
echo "If 0 rows above → zero double-bookings confirmed."
