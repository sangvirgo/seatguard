# Database Design

## Overview

Each microservice owns its database (Database-per-Service pattern). Shared PostgreSQL instance, separate schemas/databases.

---

## Auth Database (`auth_db`)

### users
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(20) NOT NULL DEFAULT 'USER',  -- USER, ADMIN, STAFF
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### refresh_tokens
```sql
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

---

## Event Database (`event_db`)

### events
```sql
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(500) NOT NULL,
    description     TEXT,
    venue           VARCHAR(500) NOT NULL,
    category        VARCHAR(50) NOT NULL,  -- CONCERT, SPORT, THEATER, OTHER
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',  -- DRAFT, PUBLISHED, CANCELLED, COMPLETED
    cover_image_url VARCHAR(1000),
    created_by      UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_category ON events(category);
```

### sections
```sql
CREATE TABLE sections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    price       DECIMAL(12,2) NOT NULL,
    capacity    INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sections_event ON sections(event_id);
```

### seats
```sql
CREATE TABLE seats (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id  UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    row_label   VARCHAR(10) NOT NULL,
    seat_number INTEGER NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',  -- AVAILABLE, HELD, SOLD
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(section_id, row_label, seat_number)
);

CREATE INDEX idx_seats_section ON seats(section_id);
CREATE INDEX idx_seats_status ON seats(status);
```

---

## Booking Database (`booking_db`)

### bookings
```sql
CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    event_id            UUID NOT NULL,
    seat_id             UUID NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING_PAYMENT',
    -- PENDING_PAYMENT, CONFIRMED, EXPIRED, CANCELLED, PAYMENT_FAILED
    idempotency_key     VARCHAR(255) UNIQUE,
    total_amount        DECIMAL(12,2) NOT NULL,
    payment_method      VARCHAR(50),
    payment_reference   VARCHAR(255),
    held_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at             TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ NOT NULL,
    cancelled_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- CRITICAL: Prevent double-booking — only one active booking per seat
    CONSTRAINT uq_active_booking UNIQUE (seat_id, status)
);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_event ON bookings(event_id);
CREATE INDEX idx_bookings_seat ON bookings(seat_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_expires ON bookings(expires_at) WHERE status = 'PENDING_PAYMENT';
```

**State Machine:**
```
PENDING_PAYMENT ──▶ CONFIRMED (payment success)
                  ──▶ EXPIRED (TTL timeout)
                  ──▶ CANCELLED (user cancel)
                  ──▶ PAYMENT_FAILED (payment error)
```

---

## Ticket Database (`ticket_db`)

### tickets
```sql
CREATE TABLE tickets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID NOT NULL UNIQUE,
    user_id         UUID NOT NULL,
    event_id        UUID NOT NULL,
    seat_id         UUID NOT NULL,
    check_in_code   VARCHAR(20) NOT NULL UNIQUE,  -- e.g., "SG-ABCD1234"
    qr_code_data    TEXT NOT NULL,  -- base64 encoded QR image
    status          VARCHAR(20) NOT NULL DEFAULT 'VALID',  -- VALID, USED, CANCELLED
    checked_in_at   TIMESTAMPTZ,
    checked_in_by   UUID,  -- staff user id
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_booking ON tickets(booking_id);
CREATE INDEX idx_tickets_checkin_code ON tickets(check_in_code);
CREATE INDEX idx_tickets_status ON tickets(status);
```

**State Machine:**
```
VALID ──▶ USED (check-in successful)
VALID ──▶ CANCELLED (booking cancelled)
```

---

## Notification Database (`notification_db`)

### notifications
```sql
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    type        VARCHAR(50) NOT NULL,
    -- BOOKING_HELD, BOOKING_CONFIRMED, BOOKING_EXPIRED, BOOKING_CANCELLED,
    -- BOOKING_PAYMENT_FAILED, TICKET_ISSUED, TICKET_USED
    title       VARCHAR(500) NOT NULL,
    message     TEXT NOT NULL,
    data        JSONB,
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

---

## Cross-Service Data Integrity

Since services own separate databases, consistency is maintained through:

1. **Kafka events** — eventual consistency between services
2. **Idempotency keys** — prevent duplicate operations
3. **Eventual consistency** — ticket issuance follows booking confirmation
4. **Compensating transactions** — cancellation rolls back seat status via Kafka event

## Indexing Strategy

- Primary keys: UUID (gen_random_uuid)
- Foreign keys: always indexed
- Status fields: indexed (frequent filtering)
- Time-based queries: indexed (events by start_time, bookings by expires_at)
- Unique constraints: on business keys (email, check_in_code, idempotency_key, active booking)
