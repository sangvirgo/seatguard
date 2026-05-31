# AGENT_CONTEXT.md — Project Context for AI Agents

> This file documents the full development history, architecture decisions, and current state of the SeatGuard project. It is written for other AI agents to quickly understand context when working on this project.

---

## Project Identity

**SeatGuard** — A full-stack high-concurrency ticket booking platform (like Ticketbox/Eventbrite/CGV mini). The core value proposition is **preventing double-booking under concurrent traffic** using Redis distributed locks and PostgreSQL unique constraints.

**Repository:** https://github.com/sangvirgo/seatguard  
**Live Demo:** http://206.189.47.198:3001  
**Owner:** sangvirgo (Hoàng Thượng)

---

## Architecture Overview

```
Browser → Frontend (Next.js :3001) → /api/** → API Gateway (Spring Cloud :8080) → Microservices
```

| Service | Port | Tech | Responsibility |
|---------|------|------|---------------|
| frontend | 3001 | Next.js 14, React, Tailwind CSS | Web UI, SSR, API proxy |
| api-gateway | 8080 | Spring Cloud Gateway | Routing, CORS, rate limiting, auth filter |
| auth-service | 8081 | Spring Boot 3.x, Java 21 | Register, login, JWT, Google OAuth2 |
| event-service | 8082 | Spring Boot 3.x | Events, sections, seats, image upload (Cloudinary) |
| booking-service | 8083 | Spring Boot 3.x | Seat hold (Redis lock), payment, cancellation |
| ticket-service | 8084 | Spring Boot 3.x | Ticket issuance, QR code, check-in |
| notification-service | 3000 | NestJS, Node.js | WebSocket push, Kafka consumer |
| postgres | 5432 | PostgreSQL 16 | Primary database |
| redis | 6379 | Redis 7 | Distributed lock, caching |
| kafka | 9092 | Apache Kafka 3.7 (KRaft) | Event bus |

**Key Rule:** Frontend must call `/api/**` only. Never call service ports 8081-8084 directly.

---

## Current State (as of 2026-05-31)

### What Works
- ✅ Google OAuth2 login
- ✅ User registration/login (JWT)
- ✅ Event listing (public API returns PUBLISHED events)
- ✅ Admin dashboard (RBAC protected)
- ✅ Admin event create/publish workflow
- ✅ Admin image upload (Cloudinary)
- ✅ Interactive seat map
- ✅ Seat hold with Redis distributed lock
- ✅ Demo payment flow
- ✅ Ticket issuance via Kafka
- ✅ QR check-in with duplicate rejection
- ✅ k6 double-booking proof (1 success, 14,364 conflicts, 0 duplicates)
- ✅ WebSocket notifications
- ✅ Responsive UI with dark theme
- ✅ All pages centered and polished

### What Doesn't Work / Known Limitations
- ❌ MoMo/VNPay real integration (backend adapters exist but hidden from UI)
- ❌ No CI/CD pipeline
- ❌ No production deployment (Docker Compose only)
- ❌ Notification service has no retry/dead-letter
- ❌ No monitoring stack (Prometheus/Grafana)

---

## Development History

### Phase 1: Backend Core
- Built Spring Boot microservices (auth, event, booking, ticket)
- Implemented PostgreSQL schema, Redis distributed lock, Kafka event bus
- API Gateway with Spring Cloud Gateway

### Phase 2: Google OAuth2 + Admin RBAC
- Implemented Google OAuth2 login flow
- Added ADMIN role-based access control
- Admin email configured via `ADMIN_EMAILS` env var

### Phase 3: Frontend (Next.js)
- Built responsive UI with Tailwind CSS
- Dark theme with gradient accents
- Interactive seat map component
- Admin dashboard with event CRUD

### Phase 4: Concurrency Proof
- k6 load test: 100 VUs, same seat, 30s
- Result: 1 success, 14,364 conflicts (409), 0 DB duplicates
- 4-layer protection: Redis SET NX EX, PostgreSQL unique constraint, idempotency key, application check

### Phase 5: Layout & UX Polish (2026-05-31)
**Multi-agent workflow was used extensively.** Here's what was done:

#### Fix Branch: `fix/frontend-layout-admin-ux`
- Fixed horizontal overflow (`overflow-x: hidden` on `<html>`)
- Replaced all `.container-main` with Tailwind utilities (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`)
- Added backend endpoint `GET /api/events/admin/all` (ADMIN only, returns DRAFT + PUBLISHED)
- Added `listAllEvents()` frontend function
- Unified container pattern across all pages

#### Fix Branch: `fix/real-data-env-defaults`
- **Removed hardcoded demo data** — Homepage had 6 fake events (`featuredDemo` array). Now uses real API data only.
- **Fixed hardcoded public IP** — `206.189.47.198` was in OAuth2Controller.java, auth-service application.yml, api-gateway CORS. Changed to env vars with localhost defaults.
- **Fixed Dockerfile bug** — `API_GATEWAY_URL` had `:path*` suffix (Next.js rewrite pattern, not URL)
- **Removed unused NEXT_PUBLIC URLs** from docker-compose.full.yml
- **Fixed CORS** — Added public IP to allowed origins (overridable via `CORS_ALLOWED_ORIGINS` env var)
- **Fixed login page centering** — Added `flex flex-col` to `<main>` in layout.tsx

#### Polish Branch: `feat/frontend-premium-polish`
- Reduced hero heading size (text-7xl → text-6xl)
- Reduced glow effects (900px → 600px)
- Added `btn-glow-vivid` animated gradient button
- Added section dividers for visual rhythm
- Added step connectors in "How it Works"
- Polished admin form with labels and descriptions
- Added metric card gradient variants
- Improved event table with alternating rows

---

## File Structure (Key Files)

```
seatguard/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (flex-1 flex flex-col)
│   │   ├── globals.css         # Global styles, glass-card, btn-glow
│   │   ├── page.tsx            # Homepage (real API data, no hardcoded demos)
│   │   ├── admin/page.tsx      # Admin dashboard (listAllEvents)
│   │   ├── events/page.tsx     # Events listing
│   │   ├── events/[id]/page.tsx # Event detail + seat map
│   │   ├── login/page.tsx      # Login/register form
│   │   ├── tickets/page.tsx    # My Tickets
│   │   └── proof/page.tsx      # Engineering proof
│   ├── components/
│   │   ├── Navbar.tsx          # Sticky navbar with role-based admin link
│   │   ├── EventCard.tsx       # Event card with hover effects
│   │   ├── SeatMap.tsx         # Interactive seat map
│   │   └── TicketCard.tsx      # Ticket with QR code
│   ├── lib/
│   │   ├── api.ts              # API client (listEvents, listAllEvents, etc.)
│   │   └── utils.ts            # cn() utility
│   ├── next.config.js          # API rewrite to localhost:8080
│   └── Dockerfile              # API_GATEWAY_URL=http://api-gateway:8080
├── backend/
│   ├── api-gateway/            # Spring Cloud Gateway (CORS, routing)
│   ├── auth-service/           # JWT, OAuth2, RBAC
│   ├── event-service/          # Events CRUD, image upload
│   ├── booking-service/        # Redis lock, payment
│   ├── ticket-service/         # Ticket issuance, QR
│   └── notification-service/   # NestJS, WebSocket, Kafka
├── infra/
│   ├── docker-compose.yml      # Infrastructure only
│   └── docker-compose.full.yml # Full stack (10 containers)
├── tests/
│   └── k6/double-booking.js    # Concurrency proof test
├── screenshots/                # UI screenshots for README
├── .env.example                # Template with CHANGE_ME placeholders
└── AGENT_CONTEXT.md            # This file
```

---

## Environment Configuration

### Required Env Variables
| Variable | Service | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | infra | Database password |
| `JWT_SECRET` | all backend | Min 32 chars, random string |
| `GOOGLE_CLIENT_ID` | auth | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | auth | Google OAuth2 client secret |
| `CLOUDINARY_CLOUD_NAME` | event | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | event | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | event | Cloudinary API secret |
| `ADMIN_EMAILS` | auth | Comma-separated admin emails |

### Optional Env Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3001,http://206.189.47.198:3001` | CORS origins |
| `FRONTEND_URL` | `http://localhost:3001` | OAuth redirect target |
| `API_GATEWAY_URL` | `http://api-gateway:8080` | Frontend→Gateway URL |
| `MOMO_ENABLED` | `false` | Enable MoMo payments |
| `VNPAY_ENABLED` | `false` | Enable VNPay payments |

### .env.example Rules
- Use `CHANGE_ME` placeholders, never real secrets
- Use localhost defaults, not production IPs
- Never commit `.env` (only `.env.example`)

---

## Multi-Agent Workflow Pattern

This project was developed using a **multi-agent workflow** pattern. Here's how it works:

### Standard Pattern
1. **Agent A (Inspector)** — Read-only. Finds root cause, reads all relevant files, writes report.
2. **Agent B (Implementer)** — Uses Agent A's report to implement fixes. Runs `npm run build` to verify.
3. **Agent C (Verifier)** — Builds, Docker rebuilds, smoke tests, secret scan, commits/pushes.

### When to Use Multi-Agent
- Complex frontend/backend changes
- Layout/UX polish tasks
- Security audits
- Merge + docs finalization

### Agent Task Template
```
Task: [Clear description]
Repo: /root/projects/seatguard
Branch: [branch name]
Git config: name=sangvirgo, email=tansang06092004@gmail.com

Rules:
- Use absolute path only
- Do NOT change [specific things]
- After changes: npm run build
- Write report to: /root/projects/seatguard/[agent-name]-report.md
```

---

## Git Conventions

- **Branch naming:** `fix/`, `feat/`, `chore/`
- **Commit style:** Conventional Commits (`fix(frontend):`, `feat(admin):`, `docs:`, `chore:`)
- **Git config:** name=sangvirgo, email=tansang06092004@gmail.com
- **Never commit:** `.env`, secrets, build artifacts, agent report files
- **Agent reports:** Added to `.gitignore` (pattern: `agent-*.md`, `finalize-report.md`, `fix-*.md`)

---

## Common Commands

```bash
# Docker full stack
cd /root/projects/seatguard/infra
docker compose -f docker-compose.full.yml up -d
docker compose -f docker-compose.full.yml down

# Frontend build
cd /root/projects/seatguard/frontend
npm run build

# Backend build (specific service)
cd /root/projects/seatguard/backend/auth-service
mvn clean package -DskipTests

# Smoke test
curl -I http://localhost:3001
curl -I http://localhost:8080/api/events

# Secret scan
cd /root/projects/seatguard
git grep -n "DemoPass123\|GOCSPX\|Pejlz\|seatguard_dev_2026"

# Hardcoded IP scan
git grep -n "206.189.47.198" -- ':!README.md' ':!docs/**' ':!reports/**'

# k6 concurrency test
k6 run tests/k6/double-booking.js
```

---

## Troubleshooting

### CORS 403 errors
- Check `CORS_ALLOWED_ORIGINS` in api-gateway application.yml
- Default includes localhost and public IP
- Override via env var if deploying to different domain

### Login returns 401
- User doesn't exist in DB — register first
- Check `ADMIN_EMAILS` env var for admin role assignment

### Homepage shows "No events yet"
- This is CORRECT behavior — no hardcoded demo data
- Create events via admin dashboard (`/admin`)
- Events must be PUBLISHED to appear on homepage

### Admin shows "No events found"
- Admin uses `GET /api/events/admin/all` (returns all events)
- If empty, no events exist in DB
- Create event → add section → generate seats → publish

### Docker containers not starting
- Check `.env` file exists and has all required variables
- `docker compose logs [service-name]` for error details
- Ensure ports 3001, 8080-8084, 5432, 6379, 9092 are available

---

## Screenshots

Located in `/root/projects/seatguard/screenshots/`:
- `homepage.png` — Hero, event cards, sections
- `events.png` — Event listing with search/filters
- `login.png` — Centered login form
- `proof.png` — Engineering proof page

---

## For Future AI Agents

When working on this project:
1. **Read this file first** to understand context
2. **Check current branch** before making changes
3. **Use multi-agent workflow** for complex tasks
4. **Never hardcode secrets or public IPs** in source code
5. **Frontend must use `/api/**` only** — never direct service ports
6. **Run `npm run build`** after frontend changes
7. **Docker compose file is at** `infra/docker-compose.full.yml`
8. **Git config:** name=sangvirgo, email=tansang06092004@gmail.com
9. **Agent reports go in repo root** but are gitignored
10. **Always verify with smoke tests** after changes

---

*Last updated: 2026-05-31 by multi-agent workflow*
