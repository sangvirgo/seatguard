# AGENTS.md — SeatGuard Agent Workflow Rules

## Core Principles

1. **One coder at a time.** Only one agent may actively write code per service at any given moment. No parallel edits to the same service.
2. **Reviewer is read-only.** The reviewing agent must NOT modify code. Review comments only.
3. **No direct push to `main`.** All changes go through feature branches and pull requests.
4. **Feature branches only.** Branch naming: `feature/{service}-{description}` (e.g., `feature/booking-hold-seat`).
5. **Always report git status.** Every agent turn must include: current branch, uncommitted files, and last commit hash.

## Service Boundaries

### Spring Boot (backend/) — Java 21 / Spring Boot 3.3
Responsible for:
- **Authentication & Authorization** — JWT-based auth, role management
- **Event Management** — CRUD, seat maps, sections, publishing
- **Booking Engine** — Seat hold, payment processing, cancellation, expiration
- **Seat Locking** — Redis distributed lock management
- **Ticket Management** — Issuance, QR generation, check-in validation
- **Database Access** — PostgreSQL via Spring Data JPA

### Node.js (notification-service/) — Node.js 22 / Fastify
Responsible for:
- **Kafka Consumer** — Consume booking/ticket events
- **WebSocket Server** — Real-time notifications to clients
- **Push Notifications** — Email/SMS/push delivery
- **Notification Storage** — Read/unread status, notification history

**⚠️ Node.js must NOT handle booking logic, payment, or seat locking. Those belong to Spring Boot.**

## Infrastructure Rules

- **Kafka, not Redpanda.** Use Apache Kafka 3.7 with KRaft mode (no ZooKeeper).
- **Redis + DB dual protection.** Every seat operation must check/set Redis lock AND rely on PostgreSQL unique constraint. Neither alone is sufficient.
- **Docker Compose for local dev only.** Production infrastructure is managed separately.

## Error Handling

- **Stop after 2 failed fixes.** If an agent fails to fix the same issue twice, escalate to the human. Do not loop indefinitely.
- **Always log the error.** Include full stack trace or error message in the report.
- **Idempotency first.** Every write operation should be safe to retry.

## Git Workflow

```
main (protected) ← PR ← feature/branch-name
```

1. Create feature branch from `main`
2. Make changes, commit incrementally
3. Push branch, open PR
4. Reviewer agent reviews (read-only)
5. Merge to `main` after approval

## Commit Messages

Follow conventional commits:
- `feat: add seat hold endpoint`
- `fix: resolve race condition in booking expiration`
- `chore: update Docker Compose config`
- `docs: add API contract for booking service`
- `test: add k6 double-booking load test`

## Communication Protocol

When reporting to the human, include:
1. **What was done** — Summary of changes
2. **What's next** — Recommended next steps
3. **Blockers** — Any issues requiring human intervention
4. **Git status** — Branch, uncommitted changes, latest commit
