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
USER_ID=""
EVENT_ID=""
SECTION_ID=""
SEAT_ID=""
BOOKING_ID=""
TICKET_ID=""

check() {
  local desc="$1" expected="$2" actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "PASS: $desc"
    PASS=$((PASS+1))
  else
    echo "FAIL: $desc (expected: $expected, got: $actual)"
    FAIL=$((FAIL+1))
  fi
}

echo "========================================="
echo "SeatGuard Full-Stack Integration Test"
echo "========================================="
echo ""

# 1. Health
echo "=== 1. HEALTH CHECKS ==="
for port in 8080 8081 8082 8083 8084; do
  RESP=$(curl -s --max-time 3 "$BASE:$port/actuator/health" 2>/dev/null || echo "FAIL")
  if echo "$RESP" | grep -q '"status":"UP"'; then
    echo "PASS: Port $port UP"
    PASS=$((PASS+1))
  else
    echo "FAIL: Port $port DOWN"
    FAIL=$((FAIL+1))
  fi
done
RESP=$(curl -s --max-time 3 "$NOTIF_SVC/health" 2>/dev/null || echo "FAIL")
if echo "$RESP" | grep -q '"status":"ok"'; then
  echo "PASS: Port 3000 notification UP"
  PASS=$((PASS+1))
else
  echo "FAIL: Port 3000 notification DOWN"
  FAIL=$((FAIL+1))
fi
echo ""

# 2. Auth: Register
echo "=== 2. AUTH: REGISTER ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_SVC/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@seatguard.com","password":"SecurePass123!","fullName":"Test User","phone":"+84901234567"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Register returns 200 or 201" "20" "$HTTP_CODE"
echo ""

# 3. Auth: Login
echo "=== 3. AUTH: LOGIN ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_SVC/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@seatguard.com","password":"SecurePass123!"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Login returns 200" "200" "$HTTP_CODE"
TOKEN=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)
USER_ID=$(echo "$TOKEN" | cut -d'.' -f2 | python3 -c "import sys,base64,json; d=sys.stdin.read().strip(); d+='='*(4-len(d)%4); print(json.loads(base64.urlsafe_b64decode(d))['sub'])" 2>/dev/null)
echo "  userId: $USER_ID"
echo ""

# 4. Auth: Me
echo "=== 4. AUTH: ME ==="
RESP=$(curl -s -w "\n%{http_code}" "$AUTH_SVC/api/auth/me" -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Auth/me returns 200" "200" "$HTTP_CODE"
echo "  $BODY"
echo ""

# 5. Event: Create
echo "=== 5. EVENT: CREATE ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$EVENT_SVC/api/events" \
  -H "Content-Type: application/json" \
  -d '{"name":"Concert Test 2026","description":"Integration test event","venue":"Test Stadium","category":"CONCERT","startTime":"2026-07-15T19:00:00Z","endTime":"2026-07-15T23:00:00Z"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Create event returns 201" "201" "$HTTP_CODE"
EVENT_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  eventId: $EVENT_ID"
echo ""

# 6. Section
echo "=== 6. EVENT: ADD SECTION ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$EVENT_SVC/api/events/$EVENT_ID/sections" \
  -H "Content-Type: application/json" \
  -d '{"name":"VIP","description":"VIP Section","price":2500000,"capacity":100}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Add section returns 201" "201" "$HTTP_CODE"
SECTION_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo ""

# 7. Generate seats
echo "=== 7. EVENT: GENERATE SEATS ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$EVENT_SVC/api/events/$EVENT_ID/seats/generate" \
  -H "Content-Type: application/json" \
  -d '{"rowsPerSection":5,"seatsPerRow":10}')
HTTP_CODE=$(echo "$RESP" | tail -1)
check "Generate seats returns 200" "200" "$HTTP_CODE"
echo ""

# 8. Publish
echo "=== 8. EVENT: PUBLISH ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$EVENT_SVC/api/events/$EVENT_ID/publish")
HTTP_CODE=$(echo "$RESP" | tail -1)
check "Publish returns 200" "200" "$HTTP_CODE"
echo ""

# 9. Seat map
echo "=== 9. EVENT: SEAT MAP ==="
RESP=$(curl -s -w "\n%{http_code}" "$EVENT_SVC/api/events/$EVENT_ID/seat-map")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Seat map returns 200" "200" "$HTTP_CODE"
SEAT_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['sections'][0]['seats'][0]['id'])" 2>/dev/null || echo "")
echo "  seatId: $SEAT_ID"
echo ""

# 10. Booking: Hold
echo "=== 10. BOOKING: HOLD ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BOOKING_SVC/api/bookings/hold" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d "{\"eventId\":\"$EVENT_ID\",\"seatId\":\"$SEAT_ID\",\"idempotencyKey\":\"test-hold-$(date +%s)\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Hold seat returns 201" "201" "$HTTP_CODE"
BOOKING_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "  bookingId: $BOOKING_ID"
echo ""

# 11. Duplicate hold
echo "=== 11. BOOKING: DUPLICATE HOLD ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BOOKING_SVC/api/bookings/hold" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d "{\"eventId\":\"$EVENT_ID\",\"seatId\":\"$SEAT_ID\",\"idempotencyKey\":\"test-hold-dup-$(date +%s)\"}")
HTTP_CODE=$(echo "$RESP" | tail -1)
check "Duplicate hold returns 409" "409" "$HTTP_CODE"
echo ""

# 12. Pay
echo "=== 12. BOOKING: PAY ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BOOKING_SVC/api/bookings/$BOOKING_ID/pay" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d '{"paymentMethod":"CREDIT_CARD"}')
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Pay returns 200" "200" "$HTTP_CODE"
check "Status CONFIRMED" "CONFIRMED" "$BODY"
echo ""

# 13. Ticket (wait for Kafka)
echo "=== 13. TICKET: CHECK ==="
sleep 8
RESP=$(curl -s -w "\n%{http_code}" "$TICKET_SVC/api/tickets/me" \
  -H "X-User-Id: $USER_ID")
HTTP_CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)
check "Tickets returns 200" "200" "$HTTP_CODE"
if echo "$BODY" | grep -q '"id"'; then
  TICKET_ID=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['id'])" 2>/dev/null || echo "")
  CHECKIN_CODE=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['checkInCode'])" 2>/dev/null || echo "")
  echo "PASS: Ticket issued: $TICKET_ID code=$CHECKIN_CODE"
  PASS=$((PASS+1))
else
  echo "FAIL: No ticket found"
  FAIL=$((FAIL+1))
fi
echo ""

# 14. Check-in
echo "=== 14. TICKET: CHECK-IN ==="
if [ -n "$TICKET_ID" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$TICKET_SVC/api/tickets/$TICKET_ID/check-in" \
    -H "X-User-Id: $USER_ID")
  HTTP_CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | head -1)
  check "Check-in returns 200" "200" "$HTTP_CODE"
  echo ""

  # 15. Duplicate check-in
  echo "=== 15. TICKET: DUPLICATE CHECK-IN ==="
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$TICKET_SVC/api/tickets/$TICKET_ID/check-in" \
    -H "X-User-Id: $USER_ID")
  HTTP_CODE=$(echo "$RESP" | tail -1)
  check "Duplicate check-in rejected" "4" "$HTTP_CODE"
  echo ""
fi

echo "========================================="
echo "RESULTS: $PASS PASS / $FAIL FAIL"
echo "========================================="
