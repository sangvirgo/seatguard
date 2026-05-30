# API Contract

## Base URL
```
http://localhost:8080/api
```

All requests go through API Gateway. Authenticated endpoints require `Authorization: Bearer <token>`.

---

## Auth Service

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "Nguyen Van A",
  "phone": "+84901234567"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Nguyen Van A",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

### POST /auth/login
Authenticate and receive tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 900
}
```

### POST /auth/refresh
Refresh access token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJ...",
  "expiresIn": 900
}
```

### GET /auth/me
Get current user profile. **Requires auth.**

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Nguyen Van A",
  "phone": "+84901234567",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

---

## Event Service

### POST /events
Create a new event. **Requires auth (admin).**

**Request:**
```json
{
  "name": "Concert A 2026",
  "description": "Summer music festival",
  "venue": "National Stadium, HCMC",
  "startTime": "2026-06-15T19:00:00Z",
  "endTime": "2026-06-15T23:00:00Z",
  "category": "CONCERT"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Concert A 2026",
  "status": "DRAFT",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

### PUT /events/{eventId}
Update event details. **Requires auth (admin).**

### POST /events/{eventId}/sections
Add a section to an event. **Requires auth (admin).**

**Request:**
```json
{
  "name": "VIP",
  "description": "Front row VIP seats",
  "price": 2500000,
  "capacity": 50
}
```

### POST /events/{eventId}/seats/generate
Auto-generate seats for all sections. **Requires auth (admin).**

**Request:**
```json
{
  "rowsPerSection": 10,
  "seatsPerRow": 20
}
```

### POST /events/{eventId}/publish
Publish event (DRAFT → PUBLISHED). **Requires auth (admin).**

### GET /events
List published events. Public.

**Query params:** `page`, `size`, `category`, `search`

### GET /events/{eventId}
Get event details. Public.

### GET /events/{eventId}/seat-map
Get full seat map with availability status. Public.

**Response (200):**
```json
{
  "eventId": "uuid",
  "sections": [
    {
      "id": "uuid",
      "name": "VIP",
      "seats": [
        {
          "id": "uuid",
          "row": "A",
          "number": 1,
          "status": "AVAILABLE",
          "price": 2500000
        }
      ]
    }
  ]
}
```

---

## Booking Service

### POST /bookings/hold
Hold a seat. **Requires auth.**

**Request:**
```json
{
  "eventId": "uuid",
  "seatId": "uuid",
  "idempotencyKey": "unique-request-id-123"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "seatId": "uuid",
  "status": "PENDING_PAYMENT",
  "expiresAt": "2026-06-15T19:05:00Z",
  "createdAt": "2026-06-15T19:00:00Z"
}
```

**Error (409):** Seat already held/sold
```json
{
  "error": "SEAT_NOT_AVAILABLE",
  "message": "This seat is no longer available"
}
```

### POST /bookings/{bookingId}/pay
Process payment for a held seat. **Requires auth.**

**Request:**
```json
{
  "paymentMethod": "CREDIT_CARD",
  "paymentDetails": {
    "cardNumber": "**** **** **** 1234",
    "expiryMonth": "12",
    "expiryYear": "2027"
  }
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "CONFIRMED",
  "paidAt": "2026-06-15T19:02:00Z"
}
```

### POST /bookings/{bookingId}/cancel
Cancel a booking. **Requires auth.**

**Response (200):**
```json
{
  "id": "uuid",
  "status": "CANCELLED"
}
```

### GET /bookings/{bookingId}
Get booking details. **Requires auth.**

### GET /bookings/me
List current user's bookings. **Requires auth.**

---

## Ticket Service

### GET /tickets/me
List current user's tickets. **Requires auth.**

### GET /tickets/{ticketId}
Get ticket details with QR code. **Requires auth.**

**Response (200):**
```json
{
  "id": "uuid",
  "bookingId": "uuid",
  "eventId": "uuid",
  "seatInfo": "VIP - Row A, Seat 1",
  "status": "VALID",
  "qrCode": "base64-encoded-qr-image",
  "checkInCode": "SG-ABCD1234"
}
```

### POST /tickets/{ticketId}/check-in
Check in by ticket ID. **Requires auth (staff).**

### POST /tickets/check-in/by-code
Check in by QR/check-in code. **Requires auth (staff).**

**Request:**
```json
{
  "checkInCode": "SG-ABCD1234"
}
```

---

## Notification Service

### GET /notifications/me
List user's notifications. **Requires auth.**

### PUT /notifications/{id}/read
Mark notification as read. **Requires auth.**

### WebSocket /ws/notifications
Real-time notification push. **Requires auth (JWT in query param).**

**Message format:**
```json
{
  "type": "BOOKING_CONFIRMED",
  "title": "Booking Confirmed!",
  "message": "Your booking for VIP Row A Seat 1 has been confirmed.",
  "data": { "bookingId": "uuid", "ticketId": "uuid" },
  "timestamp": "2026-06-15T19:02:00Z"
}
```

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (e.g., seat already booked) |
| 429 | Rate Limited |
| 500 | Internal Server Error |

## Rate Limits

- Auth endpoints: 10 req/min per IP
- Booking endpoints: 30 req/min per user
- Read endpoints: 100 req/min per user
