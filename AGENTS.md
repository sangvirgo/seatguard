# AGENTS.md — SeatGuard Agent Workflow

## Project Conventions

### Technology Rules
- **Spring Boot** handles: booking, payment, seat-locking, core business logic
- **Node.js (NestJS)** handles: notification service only (Kafka consumer + WebSocket)
- **Kafka** is the message broker — NOT Redpanda
- **Redis** for distributed locks (SET NX EX with TTL)
- **PostgreSQL** for persistent data with unique constraints
- Both Redis lock AND DB unique constraint are **required** for double-booking protection

### Git Workflow
- **Never push to `main`/`master` directly**
- All work goes to **feature branches** (`feature/*`, `fix/*`, `chore/*`)
- Always run and report:
  - `git status`
  - `git diff --stat` before committing
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)

### Agent Roles

#### Coder Agent
- **Only ONE active coder agent at a time**
- Can create, edit, delete files
- Can commit and push to feature branches
- Must report changes after each logical unit of work

#### Reviewer Agent
- **Read-only access**
- Reviews code, suggests changes
- Cannot commit or push
- Reports findings to orchestrator

#### Tester Agent
- **Read-only access**
- Runs tests, reports results
- Cannot modify source code
- Reports test outcomes to orchestrator

### Safety Rules
- Stop after **two failed fix attempts** — escalate to human
- Always validate before committing (lint, compile check)
- Do not modify infrastructure configs without explicit approval
- Do not start full Docker stack unless explicitly requested (RAM is limited)

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`

### Examples
```
feat(booking): implement seat hold with Redis lock
fix(auth): resolve JWT token refresh race condition
docs(api): update booking endpoint documentation
test(k6): add double-booking concurrency test
```

### Service Boundaries
| Service | Language | Can Do | Cannot Do |
|---------|----------|--------|-----------|
| api-gateway | Java/Spring | Route, filter, rate-limit | Business logic |
| auth-service | Java/Spring | Auth, JWT, user mgmt | Booking logic |
| event-service | Java/Spring | Events, seats, seat map | Payments |
| booking-service | Java/Spring | Hold, pay, cancel bookings | Notifications |
| ticket-service | Java/Spring | Tickets, QR, check-in | Bookings |
| notification-service | NestJS | Push, WebSocket, Kafka consume | Core business |
| frontend | Next.js | UI, API calls | Backend logic |
