# SeatGuard — Demo Checklist

## Pre-Demo Setup

- [ ] `cd /root/projects/seatguard/infra && docker compose -f docker-compose.full.yml up -d`
- [ ] Wait 30s for all services to initialize
- [ ] `docker compose -f docker-compose.full.yml ps` — all services UP
- [ ] Verify: `curl http://localhost:8080/actuator/health` → UP
- [ ] Verify: `curl http://localhost:3000/health` → ok

## 1. Open Frontend

- [ ] Open http://206.189.47.198:3001
- [ ] Homepage loads with featured events

## 2. Login

- [ ] Click "Login" → pre-filled demo credentials
- [ ] Login succeeds → navbar shows user
- [ ] OR: Click "Continue with Google" → Google OAuth flow

## 3. Browse Events

- [ ] Navigate to /events
- [ ] Event cards display with Cloudinary images (or gradient fallback)
- [ ] Category filter works
- [ ] Search works

## 4. Admin Creates Event

- [ ] Login as ADMIN (demo@seatguard.com / DemoPass123!)
- [ ] Navigate to /events
- [ ] Click "+ Create Demo Event"
- [ ] Event appears in listing

## 5. Admin Uploads Image

- [ ] In /events, admin panel shows "📸 Upload Event Image"
- [ ] Select event from dropdown
- [ ] Choose JPEG/PNG/WebP file (max 5MB)
- [ ] Image uploads to Cloudinary
- [ ] Event card now shows uploaded image

## 6. User Books Seat

- [ ] Click event → seat map loads
- [ ] Select available seat (green)
- [ ] Click "🔒 Hold Selected Seat"
- [ ] Seat held → "✅ Seat held! Complete payment to confirm"

## 7. User Pays (Mock)

- [ ] Payment UI shows "Demo Payment" option (MoMo/VNPay hidden from UI)
- [ ] Click "💳 Pay Now"
- [ ] Shows "🧪 Simulate Payment Success" button
- [ ] Click to confirm
- [ ] "🎉 Booking Confirmed!" appears

## 8. Ticket Issued

- [ ] Click "View My Tickets →"
- [ ] Ticket shows with QR code
- [ ] Ticket status: VALID

## 9. Check-in

- [ ] Click check-in on ticket
- [ ] Status changes to USED
- [ ] Try duplicate check-in → rejected

## 10. Payment Provider States

- [ ] Mock payment: works end-to-end (hold → pay → ticket)
- [ ] MoMo/VNPay: backend adapters exist but are hidden from public demo UI

## 11. Technical Evidence

- [ ] Open /proof
- [ ] Shows build results, API tests, k6 load test results
- [ ] k6: exactly 1 success, conflicts for others, 0 duplicates

## 12. Docker Health

- [ ] All services healthy: `docker compose ps`
- [ ] notification-service: healthy (Kafka consumer connected)
- [ ] No crash logs: `docker compose logs --tail=20 notification-service`

## Cleanup

- [ ] `cd /root/projects/seatguard/infra && docker compose -f docker-compose.full.yml down`
