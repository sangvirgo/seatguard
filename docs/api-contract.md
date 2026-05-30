# API Contract

Base URL: `http://localhost:8080/api/v1`

All endpoints require `Content-Type: application/json` unless noted.
Authenticated endpoints require `Authorization: Bearer {jwt_token}`.

---

## 1. Auth

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

**Response: `201 Created`**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Nguyen Van A",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `400` — Validation failed
- `409` — Email already registered

---

### POST /auth/login
Authenticate and receive tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response: `200 OK`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "expiresIn": 900,
  "tokenType": "Bearer"
}
```

**Errors:**
- `400` — Validation failed
- `401` — Invalid credentials

---

### POST /auth/refresh
Refresh an expired access token.

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

**Response: `200 OK`**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "tokenType": "Bearer"
}
```

**Errors:**
- `401` — Invalid or expired refresh token

---

### GET /auth/me 🔒
Get current user profile.

**Response: `200 OK`**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "fullName": "Nguyen Van A",
  "phone": "+84901234567",
  "roles": ["USER"],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `401` — Unauthorized

---

## 2. Event

### POST /events 🔒 (Admin)
Create a new event.

**Request:**
```json
{
  "name": "Concert: Son Tung M-TP",
  "description": "Live concert at My Dinh Stadium",
  "venue": "My Dinh National Stadium, Hanoi",
  "startTime": "2024-06-15T19:00:00Z",
  "endTime": "2024-06-15T22:00:00Z",
  "category": "CONCERT",
  "imageUrl": "https://cdn.seatguard.vn/events/sontung.jpg"
}
```

**Response: `201 Created`**
```json
{
  "id": "uuid",
  "name": "Concert: Son Tung M-TP",
  "status": "DRAFT",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### GET /events
List events with pagination and filters.

**Query Parameters:**
- `page` (int, default: 0)
- `size` (int, default: 20)
- `category` (string, optional)
- `status` (string, optional: DRAFT, PUBLISHED, CANCELLED, COMPLETED)
- `search` (string, optional — searches name and description)

**Response: `200 OK`**
```json
{
  "content": [
    {
      "id": "uuid",
      "name": "Concert: Son Tung M-TP",
      "venue": "My Dinh National Stadium, Hanoi",
      "startTime": "2024-06-15T19:00:00Z",
      "status": "PUBLISHED",
      "minPrice": 500000,
      "maxPrice": 5000000,
      "imageUrl": "https://cdn.seatguard.vn/events/sontung.jpg"
    }
  ],
  "totalElements": 42,
  "totalPages": 3,
  "number": 0
}
```

---

### GET /events/{eventId}
Get event details with seat map summary.

**Response: `200 OK`**
```json
{
  "id": "uuid",
  "name": "Concert: Son Tung M-TP",
  "description": "Live concert at My Dinh Stadium",
  "venue": "My Dinh National Stadium, Hanoi",
  "startTime": "2024-06-15T19:00:00Z",
  "endTime": "2024-06-15T22:00:00Z",
  "status": "PUBLISHED",
  "category": "CONCERT",
  "imageUrl": "https://cdn.seatguard.vn/events/sontung.jpg",
  "sections": [
    {
      "id": "uuid",
      "name": "VIP",
      "price": 5000000,
      "totalSeats": 100,
      "availableSeats": 67
    }
  ],
  "totalSeats": 5000,
  "availableSeats": 3200
}
```

---

### PUT /events/{eventId} 🔒 (Admin)
Update event details.

**Request:** Same as POST, partial updates allowed.

**Response: `200 OK`** — Updated event object.

**Errors:**
- `400` — Validation failed
- `404` — Event not found
- `409` — Cannot modify published event's seat map

---

### DELETE /events/{eventId} 🔒 (Admin)
Soft-delete an event.

**Response: `204 No Content`**

**Errors:**
- `404` — Event not found
- `409` — Event has active bookings

---

### POST /events/{eventId}/publish 🔒 (Admin)
Publish an event, making it visible and bookable.

**Response: `200 OK`**
```json
{
  "id": "uuid",
  "status": "PUBLISHED",
  "publishedAt": "2024-01-15T12:00:00Z"
}
```

**Errors:**
- `409` — Event must have at least one section with seats
- `409` — Event already published

---

### GET /events/{eventId}/seat-map
Get the full seat map for an event.

**Response: `200 OK`**
```json
{
  "eventId": "uuid",
  "sections": [
    {
      "id": "uuid",
      "name": "VIP",
      "price": 5000000,
      "rows": [
        {
          "rowLabel": "A",
          "seats": [
            {
              "id": "uuid",
              "seatNumber": "1",
              "label": "A-1",
              "status": "AVAILABLE",
              "price": 5000000
            },
            {
              "id": "uuid",
              "seatNumber": "2",
              "label": "A-2",
              "status": "HELD",
              "price": 5000000
            }
          ]
        }
      ]
    }
  ]
}
```

---

### POST /events/{eventId}/sections 🔒 (Admin)
Add a section to an event.

**Request:**
```json
{
  "name": "VIP",
  "description": "Front rows, closest to stage",
  "price": 5000000,
  "rowCount": 10,
  "seatsPerRow": 20
}
```

**Response: `201 Created`**
```json
{
  "id": "uuid",
  "name": "VIP",
  "price": 5000000,
  "totalSeats": 200
}
```

---

### POST /events/{eventId}/sections/{sectionId}/generate-seats 🔒 (Admin)
Auto-generate seats for a section.

**Request:**
```json
{
  "rowCount": 10,
  "seatsPerRow": 20,
  "rowLabels": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
}
```

**Response: `200 OK`**
```json
{
  "sectionId": "uuid",
  "seatsGenerated": 200,
  "rows": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
}
```

---

## 3. Booking

### POST /bookings/hold 🔒
Hold a seat for booking (starts 5-minute payment window).

**Request:**
```json
{
  "eventId": "uuid",
  "seatId": "uuid",
  "idempotencyKey": "client-generated-uuid"
}
```

**Response: `201 Created`**
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "seatId": "uuid",
  "seatLabel": "A-1",
  "sectionName": "VIP",
  "price": 5000000,
  "status": "PENDING_PAYMENT",
  "expiresAt": "2024-01-15T10:35:00Z",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `400` — Validation failed
- `404` — Event or seat not found
- `409` — Seat already held or sold (double-booking prevented)
- `409` — Duplicate idempotency key

---

### POST /bookings/{bookingId}/pay 🔒
Process payment for a held seat.

**Request:**
```json
{
  "paymentMethod": "CREDIT_CARD",
  "idempotencyKey": "client-generated-uuid"
}
```

**Response: `200 OK`**
```json
{
  "id": "uuid",
  "status": "CONFIRMED",
  "ticketId": "uuid",
  "paidAt": "2024-01-15T10:32:00Z"
}
```

**Errors:**
- `404` — Booking not found
- `409` — Booking not in PENDING_PAYMENT status
- `409` — Booking expired
- `402` — Payment failed

---

### POST /bookings/{bookingId}/cancel 🔒
Cancel a booking and release the seat.

**Response: `200 OK`**
```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "cancelledAt": "2024-01-15T10:33:00Z"
}
```

**Errors:**
- `404` — Booking not found
- `409` — Booking already confirmed (cannot cancel after payment)

---

### GET /bookings/{bookingId} 🔒
Get booking details.

**Response: `200 OK`**
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "eventName": "Concert: Son Tung M-TP",
  "seatId": "uuid",
  "seatLabel": "A-1",
  "sectionName": "VIP",
  "price": 5000000,
  "status": "CONFIRMED",
  "expiresAt": null,
  "paidAt": "2024-01-15T10:32:00Z",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### GET /bookings 🔒
List current user's bookings.

**Query Parameters:**
- `page` (int, default: 0)
- `size` (int, default: 20)
- `status` (string, optional)

**Response: `200 OK`**
```json
{
  "content": [
    {
      "id": "uuid",
      "eventName": "Concert: Son Tung M-TP",
      "seatLabel": "A-1",
      "status": "CONFIRMED",
      "price": 5000000,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "totalElements": 5,
  "totalPages": 1,
  "number": 0
}
```

---

## 4. Ticket

### GET /tickets 🔒
List current user's tickets.

**Query Parameters:**
- `page` (int, default: 0)
- `size` (int, default: 20)

**Response: `200 OK`**
```json
{
  "content": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "eventName": "Concert: Son Tung M-TP",
      "seatLabel": "A-1",
      "sectionName": "VIP",
      "status": "VALID",
      "qrCode": "data:image/png;base64,...",
      "checkedInAt": null
    }
  ],
  "totalElements": 2,
  "totalPages": 1,
  "number": 0
}
```

---

### GET /tickets/{ticketId} 🔒
Get ticket details with QR code.

**Response: `200 OK`**
```json
{
  "id": "uuid",
  "bookingId": "uuid",
  "eventId": "uuid",
  "eventName": "Concert: Son Tung M-TP",
  "eventStartTime": "2024-06-15T19:00:00Z",
  "venue": "My Dinh National Stadium, Hanoi",
  "seatLabel": "A-1",
  "sectionName": "VIP",
  "status": "VALID",
  "qrCode": "data:image/png;base64,...",
  "qrCodeData": "TKT-{uuid}-{hmac_signature}",
  "checkedInAt": null,
  "issuedAt": "2024-01-15T10:32:00Z"
}
```

---

### POST /tickets/{ticketId}/check-in 🔒 (Staff)
Check in a ticket at the venue.

**Response: `200 OK`**
```json
{
  "id": "uuid",
  "status": "USED",
  "checkedInAt": "2024-06-15T18:45:00Z",
  "eventName": "Concert: Son Tung M-TP",
  "seatLabel": "A-1"
}
```

**Errors:**
- `404` — Ticket not found
- `409` — Ticket already used
- `409` — Ticket cancelled

---

### GET /tickets/code/{qrCodeData} 🔒 (Staff)
Look up ticket by QR code data.

**Response: `200 OK`** — Same as GET /tickets/{ticketId}

---

## 5. Notification

### GET /notifications 🔒
List current user's notifications.

**Query Parameters:**
- `page` (int, default: 0)
- `size` (int, default: 20)
- `unreadOnly` (boolean, default: false)

**Response: `200 OK`**
```json
{
  "content": [
    {
      "id": "uuid",
      "type": "BOOKING_CONFIRMED",
      "title": "Booking Confirmed",
      "message": "Your booking for Concert: Son Tung M-TP (Seat A-1) has been confirmed.",
      "data": {
        "bookingId": "uuid",
        "eventId": "uuid"
      },
      "read": false,
      "createdAt": "2024-01-15T10:32:00Z"
    }
  ],
  "totalElements": 10,
  "totalPages": 1,
  "number": 0,
  "unreadCount": 3
}
```

---

### PATCH /notifications/{notificationId}/read 🔒
Mark a notification as read.

**Response: `200 OK`**
```json
{
  "id": "uuid",
  "read": true
}
```

---

### PATCH /notifications/read-all 🔒
Mark all notifications as read.

**Response: `200 OK`**
```json
{
  "markedCount": 7
}
```

---

### WebSocket /ws/notifications 🔒
Real-time notification stream.

**Connection:** `ws://localhost:3001/ws/notifications?token={jwt_token}`

**Server Messages:**
```json
{
  "type": "NOTIFICATION",
  "payload": {
    "id": "uuid",
    "type": "BOOKING_CONFIRMED",
    "title": "Booking Confirmed",
    "message": "Your booking for Seat A-1 has been confirmed.",
    "data": { "bookingId": "uuid" },
    "createdAt": "2024-01-15T10:32:00Z"
  }
}
```

```json
{
  "type": "SEAT_UPDATE",
  "payload": {
    "eventId": "uuid",
    "seatId": "uuid",
    "status": "SOLD"
  }
}
```

---

## Common Response Formats

### Error Response
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "Seat is already held by another booking",
  "path": "/api/v1/bookings/hold",
  "traceId": "abc123"
}
```

### Pagination
All list endpoints return paginated responses with:
- `content` — Array of items
- `totalElements` — Total count
- `totalPages` — Total pages
- `number` — Current page (0-indexed)

## Idempotency

Endpoints marked with payment/booking operations accept an `idempotencyKey` header or body field:
- Must be a UUID v4
- Server returns cached response for duplicate keys within 24 hours
- Prevents duplicate charges on network retries

## Rate Limiting

- **Anonymous:** 100 requests/minute
- **Authenticated:** 1000 requests/minute
- **Booking hold:** 10 requests/minute per user
