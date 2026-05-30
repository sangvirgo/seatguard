#!/bin/bash
# SeatGuard Full-Stack API Integration Test
set -e

BASE="http://localhost"
EVENT_SVC="$BASE:8082"
AUTH_SVC="$BASE:8081"
BOOKING_SVC="$BASE:8083"
TICKET_SVC="$BASE:8084"
NOTIF_SVC="$BASE:3000"

PASS=0
FAIL=0
TOKEN=""
EVENT_ID=""
SECTION_ID=""
SEAT_ID=""
BOOKING_ID=""
TICKET_ID=""

check() {
  local desc="$1" expected="$2" actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "✅ PASS: $desc"
    PASS=$((PASS+1))
  else
    echo "❌ FAIL: $desc (expected: $expected, got: $actual)"
    FAIL=$((FAIL+1))
  fi
}

echo "========================================="
echo "SeatGuard Full-Stack Integration Test"
echo "========================================="
echo ""

# ─── 1. Health Checks ─────────────────────────────────
echo "=== 1. HEALTH CHECKS ==="
for port in 8080 8081 8082 8083 8084 3000; do
  RESP=$(curl -s --max-time 3 "$BASE:$port/actuator/health" 2>/dev/null || curl -s --max-time 3 "$BASE:$port/api/health" 2>/dev/null || echo "FAIL")
  if echo "$RESP" | grep -q '"status":"UP"\|"status":"ok"'; then
    echo "✅ Port $port: UP"
    PASS=$((PASS+1))
  else
    echo "❌ Port $port: DOWN ($RESP)"
    FAIL=$((FAIL+1))
  fi
done
echo ""

# ─── 2. Auth: Register ────────────────────────────────
echo "=== 2. AUTH: REGISTER ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_SVC/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@seatguard.com","password":"Test1234!","fullName":"Test User","phone":"+84901234567"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Register returns 201" "201" "$HTTP_CODE"
echo "  Response: $BODY"
echo ""

# ─── 3. Auth: Login ───────────────────────────────────
echo "=== 3. AUTH: LOGIN ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_SVC/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@seatguard.com","password":"Test1234!"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Login returns 200" "200" "$HTTP_CODE"
TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  echo "✅ Token captured: ${TOKEN:0:30}..."
  PASS=$((PASS+1))
else
  echo "❌ No token in response"
  FAIL=$((FAIL+1))
fi
echo ""

# ─── 4. Event: Create ─────────────────────────────────
echo "=== 4. EVENT: CREATE ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$EVENT_SVC/api/events" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Concert Test 2026","description":"Integration test event","venue":"Test Stadium","category":"CONCERT","startTime":"2026-07-15T19:00:00Z","endTime":"2026-07-15T23:00:00Z"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Create event returns 201" "201" "$HTTP_CODE"
EVENT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  eventId: $EVENT_ID"
echo ""

# ─── 5. Event: Add Section ────────────────────────────
echo "=== 5. EVENT: ADD SECTION ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$EVENT_SVC/api/events/$EVENT_ID/sections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"VIP","description":"VIP Section","price":2500000,"capacity":100}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Add section returns 201" "201" "$HTTP_CODE"
SECTION_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  sectionId: $SECTION_ID"
echo ""

# ─── 6. Event: Generate Seats ─────────────────────────
echo "=== 6. EVENT: GENERATE SEATS ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$EVENT_SVC/api/events/$EVENT_ID/seats/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"rowsPerSection":5,"seatsPerRow":10}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Generate seats returns 200" "200" "$HTTP_CODE"
SEAT_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
echo "  Seats generated: $SEAT_COUNT"
echo ""

# ─── 7. Event: Publish ────────────────────────────────
echo "=== 7. EVENT: PUBLISH ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$EVENT_SVC/api/events/$EVENT_ID/publish" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Publish returns 200" "200" "$HTTP_CODE"
echo ""

# ─── 8. Event: Get Seat Map ───────────────────────────
echo "=== 8. EVENT: GET SEAT MAP ==="
RESP=$(curl -s -w "\n%{http_code}" "$EVENT_SVC/api/events/$EVENT_ID/seat-map")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Seat map returns 200" "200" "$HTTP_CODE"
SEAT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  First seatId: $SEAT_ID"
echo ""

# ─── 9. Booking: Hold Seat ────────────────────────────
echo "=== 9. BOOKING: HOLD SEAT ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BOOKING_SVC/api/bookings/hold" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"eventId\":\"$EVENT_ID\",\"seatId\":\"$SEAT_ID\",\"idempotencyKey\":\"test-hold-001\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Hold seat returns 201" "201" "$HTTP_CODE"
BOOKING_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  bookingId: $BOOKING_ID"
echo ""

# ─── 10. Booking: Duplicate Hold (should fail) ────────
echo "=== 10. BOOKING: DUPLICATE HOLD (expect conflict) ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BOOKING_SVC/api/bookings/hold" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"eventId\":\"$EVENT_ID\",\"seatId\":\"$SEAT_ID\",\"idempotencyKey\":\"test-hold-002\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Duplicate hold returns 409" "409" "$HTTP_CODE"
echo ""

# ─── 11. Booking: Pay ─────────────────────────────────
echo "=== 11. BOOKING: PAY ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BOOKING_SVC/api/bookings/$BOOKING_ID/pay" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"paymentMethod":"CREDIT_CARD"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Pay returns 200" "200" "$HTTP_CODE"
check "Status is CONFIRMED" "CONFIRMED" "$BODY"
echo ""

# ─── 12. Ticket: Check ────────────────────────────────
echo "=== 12. TICKET: CHECK ISSUED ==="
sleep 3  # Wait for Kafka event propagation
RESP=$(curl -s -w "\n%{http_code}" "$TICKET_SVC/api/tickets/me" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
echo "  Status: $HTTP_CODE"
echo "  Body: $BODY"
if echo "$BODY" | grep -q '"id"'; then
  TICKET_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "✅ Ticket found: $TICKET_ID"
  PASS=$((PASS+1))
else
  echo "⚠️ No ticket found (Kafka may not be connected)"
  FAIL=$((FAIL+1))
fi
echo ""

# ─── 13. Notification: Check ──────────────────────────
echo "=== 13. NOTIFICATION: CHECK ==="
RESP=$(curl -s --max-time 3 "$NOTIF_SVC/health")
echo "  Health: $RESP"
echo ""

# ─── SUMMARY ──────────────────────────────────────────
echo "========================================="
echo "RESULTS: $PASS PASS / $FAIL FAIL"
echo "========================================="
