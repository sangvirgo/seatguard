# Database Design

## Overview

PostgreSQL 16 serves as the primary data store. All tables use UUID primary keys, `created_at`/`updated_at` timestamps, and soft-delete where appropriate.

## Schema

### 1. users

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| full_name | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(20) | |
| roles | TEXT[] | DEFAULT '{USER}' |
| is_active | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

**Indexes:**
- `idx_users_email` — UNIQUE on `email`

---

### 2. events

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| name | VARCHAR(500) | NOT NULL |
| description | TEXT | |
| venue | VARCHAR(500) | NOT NULL |
| start_time | TIMESTAMPTZ | NOT NULL |
| end_time | TIMESTAMPTZ | NOT NULL |
| category | VARCHAR(50) | NOT NULL |
| status | VARCHAR(20) | DEFAULT 'DRAFT', CHECK (status IN ('DRAFT','PUBLISHED','CANCELLED','COMPLETED')) |
| image_url | VARCHAR(1000) | |
| published_at | TIMESTAMPTZ | |
| created_by | UUID | REFERENCES users(id) |
| is_deleted | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

**Indexes:**
- `idx_events_status` — on `status`
- `idx_events_start_time` — on `start_time`
- `idx_events_category` — on `category`

---

### 3. sections

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| event_id | UUID | REFERENCES events(id), NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| price | BIGINT | NOT NULL, CHECK (price >= 0) |
| row_count | INT | NOT NULL |
| seats_per_row | INT | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

**Constraints:**
- `uq_sections_event_name` — UNIQUE(event_id, name)

**Indexes:**
- `idx_sections_event_id` — on `event_id`

---

### 4. seats

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| section_id | UUID | REFERENCES sections(id), NOT NULL |
| row_label | VARCHAR(10) | NOT NULL |
| seat_number | VARCHAR(10) | NOT NULL |
| label | VARCHAR(20) | NOT NULL (e.g., "A-1") |
| status | VARCHAR(20) | DEFAULT 'AVAILABLE', CHECK (status IN ('AVAILABLE','HELD','SOLD')) |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

**Constraints:**
- `uq_seats_section_label` — UNIQUE(section_id, label)

**Indexes:**
- `idx_seats_section_id` — on `section_id`
- `idx_seats_status` — on `status`

---

### 5. bookings

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| user_id | UUID | REFERENCES users(id), NOT NULL |
| event_id | UUID | REFERENCES events(id), NOT NULL |
| seat_id | UUID | REFERENCES seats(id), NOT NULL |
| status | VARCHAR(20) | DEFAULT 'PENDING_PAYMENT', CHECK (status IN ('PENDING_PAYMENT','CONFIRMED','EXPIRED','CANCELLED','PAYMENT_FAILED')) |
| price | BIGINT | NOT NULL |
| idempotency_key | VARCHAR(255) | UNIQUE, NOT NULL |
| expires_at | TIMESTAMPTZ | |
| paid_at | TIMESTAMPTZ | |
| cancelled_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

**Constraints:**
- `uq_bookings_active_seat` — UNIQUE INDEX on `(seat_id)` WHERE `status IN ('PENDING_PAYMENT', 'CONFIRMED')`
  - **This is the critical double-booking prevention constraint.**
  - Ensures only one active booking per seat at the database level.

**Indexes:**
- `idx_bookings_user_id` — on `user_id`
- `idx_bookings_event_id` — on `event_id`
- `idx_bookings_status` — on `status`
- `idx_bookings_expires_at` — on `expires_at` (for expiration scheduler)

**Partial Index (Double-Booking Prevention):**
```sql
CREATE UNIQUE INDEX uq_bookings_active_seat
ON bookings (seat_id)
WHERE status IN ('PENDING_PAYMENT', 'CONFIRMED');
```

---

### 6. tickets

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| booking_id | UUID | REFERENCES bookings(id), UNIQUE, NOT NULL |
| user_id | UUID | REFERENCES users(id), NOT NULL |
| event_id | UUID | REFERENCES events(id), NOT NULL |
| seat_id | UUID | REFERENCES seats(id), NOT NULL |
| status | VARCHAR(20) | DEFAULT 'VALID', CHECK (status IN ('VALID','USED','CANCELLED')) |
| qr_code_data | VARCHAR(500) | UNIQUE, NOT NULL |
| checked_in_at | TIMESTAMPTZ | |
| issued_at | TIMESTAMPTZ | DEFAULT now() |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

**Indexes:**
- `idx_tickets_user_id` — on `user_id`
- `idx_tickets_event_id` — on `event_id`
- `idx_tickets_qr_code_data` — UNIQUE on `qr_code_data`
- `idx_tickets_status` — on `status`

---

### 7. notifications

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| user_id | UUID | REFERENCES users(id), NOT NULL |
| type | VARCHAR(50) | NOT NULL |
| title | VARCHAR(255) | NOT NULL |
| message | TEXT | NOT NULL |
| data | JSONB | |
| is_read | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | DEFAULT now() |

**Indexes:**
- `idx_notifications_user_id` — on `user_id`
- `idx_notifications_user_read` — on `(user_id, is_read)`
- `idx_notifications_created_at` — on `created_at` DESC

---

## State Machines

### Seat Status

```
┌───────────┐     hold      ┌──────┐     confirm     ┌──────┐
│ AVAILABLE │───────────────▶│ HELD │─────────────────▶│ SOLD │
└───────────┘                └──────┘                  └──────┘
      ▲                          │
      │         release          │
      └──────────────────────────┘
           (cancel/expire)
```

**Transitions:**
- `AVAILABLE → HELD` — Seat held during booking (Redis lock + DB update)
- `HELD → SOLD` — Payment confirmed, ticket issued
- `HELD → AVAILABLE` — Booking cancelled or expired, seat released

### Booking Status

```
                    ┌───────────────────┐
                    │  PENDING_PAYMENT  │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌─────────────────┐
        │CONFIRMED │   │ EXPIRED  │   │PAYMENT_FAILED   │
        └──────────┘   └──────────┘   └─────────────────┘
              │
              ▼
        ┌──────────┐
        │CANCELLED │
        └──────────┘
```

**Transitions:**
- `PENDING_PAYMENT → CONFIRMED` — Payment successful
- `PENDING_PAYMENT → EXPIRED` — 5-minute window expired (scheduled task)
- `PENDING_PAYMENT → PAYMENT_FAILED` — Payment processing failed
- `PENDING_PAYMENT → CANCELLED` — User cancelled
- `CONFIRMED → CANCELLED` — User cancelled (allowed with refund logic)

### Ticket Status

```
┌───────┐     check-in    ┌──────┐
│ VALID │─────────────────▶│ USED │
└───────┘                 └──────┘
    │
    │ cancel
    ▼
┌───────────┐
│ CANCELLED │
└───────────┘
```

**Transitions:**
- `VALID → USED` — Staff scans QR code at venue
- `VALID → CANCELLED` — Booking cancelled, ticket invalidated

---

## Migration Strategy

- Use Flyway for database migrations
- Migration files: `backend/src/main/resources/db/migration/`
- Naming: `V{version}__{description}.sql` (e.g., `V1__create_users_table.sql`)
- All schema changes through migrations, never manual SQL in production

## Backup Strategy

- **Continuous:** PostgreSQL WAL archiving for point-in-time recovery
- **Daily:** Full database backup to object storage
- **Retention:** 30 days for daily backups, 1 year for monthly snapshots
