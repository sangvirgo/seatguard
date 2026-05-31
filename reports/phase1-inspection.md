# Phase 1 — Read-Only Inspection Report

**Date:** 2026-05-30 17:19 UTC
**Branch:** `feature/backend-google-oauth-admin-rbac`
**Project:** SeatGuard — Premium Ticket Booking Platform

---

## 1. Project Status

### Git Status
```
On branch feature/backend-google-oauth-admin-rbac
Changes not staged for commit:
	modified:   .gitignore
Untracked files:
	FINAL_REPORT.md
	backend/api-gateway/target/
	backend/auth-service/target/
	backend/booking-service/target/
	backend/event-service/target/
	backend/ticket-service/target/
	logs/
	notification-service/dist/
	notification-service/node_modules/
	notification-service/package-lock.json
	notification-service/tsconfig.build.tsbuildinfo
```

### Git Log (Last 5 Commits)
```
f824cc5 fix: center background glow to remove visual left-shift
70e80df fix: center event cards grid, move step badges inside cards, vertical feature layout
dcbdfc3 fix: center all homepage sections properly
153b760 fix: improve card spacing and layout balance
18d5820 fix: resolve text overlap and improve card spacing
```
**Note:** All recent commits are frontend CSS/layout fixes. No backend changes in recent history.

### Docker Compose PS
```
no configuration file provided: not found
```
**Services are NOT running.** The `docker-compose.yml` is in `infra/` directory, not project root. Must use `docker compose -f infra/docker-compose.full.yml ps`.

---

## 2. Project Structure

```
seatguard/
├── .env                          # ⚠️ Contains Google OAuth secrets
├── AGENTS.md
├── FINAL_REPORT.md
├── README.md
├── backend/
│   ├── api-gateway/              # Spring Cloud Gateway (port 8080)
│   ├── auth-service/             # Spring Boot Auth (port 8081)
│   ├── booking-service/          # Spring Boot Booking (port 8083)
│   ├── event-service/            # Spring Boot Events (port 8082)
│   └── ticket-service/           # Spring Boot Tickets (port 8084)
├── docs/                         # Architecture, API contracts, DB design
├── frontend/                     # Next.js 14 (port 3001)
├── infra/
│   ├── docker-compose.yml        # Infrastructure only (Postgres, Redis, Kafka)
│   ├── docker-compose.full.yml   # Full stack (all services + frontend)
│   └── init-db.sql               # Creates 5 databases
├── logs/                         # Service logs
├── notification-service/         # NestJS (port 3000)
├── reports/                      # Test reports
├── scripts/                      # Docker helper scripts
└── tests/                        # k6 + smoke tests
```

---

## 3. API Gateway Inspection

### Route Configuration (`backend/api-gateway/src/main/resources/application.yml`)

```yaml
server:
  port: 8080

spring:
  cloud:
    gateway:
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins:
              - "http://localhost:3001"
              - "http://206.189.47.198:3001"
            allowedMethods: [GET, POST, PUT, DELETE, OPTIONS]
            allowedHeaders: "*"
            allowCredentials: true
      routes:
        - id: auth-service
          uri: http://auth-service:8081
          predicates: [Path=/api/auth/**]
        - id: event-service
          uri: http://event-service:8082
          predicates: [Path=/api/events/**]
        - id: booking-service
          uri: http://booking-service:8083
          predicates: [Path=/api/bookings/**]
        - id: ticket-service
          uri: http://ticket-service:8084
          predicates: [Path=/api/tickets/**]
        - id: notification-service
          uri: http://notification-service:3000
          predicates: [Path=/api/notifications/**]
```

### Route Analysis

| Path Pattern | Service | Routed? |
|---|---|---|
| `/api/auth/**` | auth-service:8081 | ✅ |
| `/api/events/**` | event-service:8082 | ✅ |
| `/api/bookings/**` | booking-service:8083 | ✅ |
| `/api/tickets/**` | ticket-service:8084 | ✅ |
| `/api/notifications/**` | notification-service:3000 | ✅ |
| `/oauth2/**` | — | ❌ **NOT routed** |
| `/login/oauth2/**` | — | ❌ **NOT routed** |

### Gateway Dependencies (`pom.xml`)
- `spring-cloud-starter-gateway` (Spring Cloud 2023.0.1, Boot 3.2.5)
- `spring-boot-starter-actuator`
- **NO security dependencies** — gateway is purely routing, no auth/filter
- **NO Spring Security** — gateway does not validate JWT or pass user context

### Gateway Application
```java
@SpringBootApplication
public class SeatGuardGatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(SeatGuardGatewayApplication.class, args);
    }
}
```
**Plain bootstrap only.** No custom filters, no JWT validation, no user header forwarding.

### Key Findings — Gateway
- ❌ **No OAuth2 routes** (`/oauth2/**`, `/login/oauth2/**` not routed)
- ❌ **No JWT validation** at gateway level
- ❌ **No user context forwarding** — downstream services receive raw requests
- ❌ **No authentication filter** on gateway
- ⚠️ CORS allows `http://206.189.47.198:3001` (production IP hardcoded)

---

## 4. Auth Service Inspection

### Security Configuration (`SecurityConfig.java`)

```java
http
    .csrf(csrf -> csrf.disable())
    .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/refresh").permitAll()
        .requestMatchers("/actuator/**").permitAll()
        .anyRequest().authenticated()
    )
    .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
```

**Permit-all paths:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `/actuator/**`

**Everything else requires JWT.**

### JWT Configuration

```java
@Component
public class JwtUtil {
    private final SecretKey secretKey;
    private final long expirationMs;

    public String generateToken(UUID userId, String email, String role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(secretKey)
                .compact();
    }
}
```

**JWT Config (`application.yml`):**
```yaml
jwt:
  secret: ${JWT_SECRET:aVeryLongSecretKeyThatIsAtLeast32CharactersLongForHS256!}
  expiration: ${JWT_EXPIRATION:900000}       # 15 minutes
  refresh-expiration: ${JWT_REFRESH_EXPIRATION:604800000}  # 7 days
```

**JWT Claims:** `sub` (userId), `email`, `role`

### JWT Authentication Filter

```java
if (jwtUtil.validateToken(token)) {
    UUID userId = jwtUtil.getUserIdFromToken(token);
    String email = claims.get("email", String.class);
    String role = claims.get("role", String.class);

    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
            userId.toString(), null,
            List.of(new SimpleGrantedAuthority("ROLE_" + (role != null ? role : "USER")))
    );
    SecurityContextHolder.getContext().setAuthentication(authentication);
}
```

**Authorities granted:** `ROLE_USER`, `ROLE_ADMIN`, `ROLE_STAFF`

### User Entity

```java
@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String email;        // unique, not null
    private String passwordHash; // not null
    private String fullName;     // not null
    private String phone;
    private Role role = Role.USER; // enum: USER, ADMIN, STAFF
    private Boolean isActive = true;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### Role Enum
```java
public enum Role {
    USER,
    ADMIN,
    STAFF
}
```
**Three roles exist:** USER, ADMIN, STAFF. No fine-grained permissions — just role names.

### Auth Endpoints (`AuthController.java`)

| Method | Path | Auth Required? | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login with email/password |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/me` | Yes (JWT) | Get current user profile |

### Login Flow
1. Client sends `{email, password}` to `POST /api/auth/login`
2. Service looks up user by email
3. Verifies password with BCrypt
4. Returns `{accessToken, refreshToken, expiresIn}`
5. Client stores tokens in `localStorage`

### Register Flow
1. Client sends `{email, password, fullName, phone}` to `POST /api/auth/register`
2. Checks email uniqueness
3. Hashes password with BCrypt
4. Creates user with `Role.USER` (always)
5. Returns `{accessToken, refreshToken, expiresIn}`

### Profile Endpoint (`/api/auth/me`)
```java
@GetMapping("/me")
public ResponseEntity<UserResponse> getProfile(@RequestHeader("Authorization") String authorization) {
    String token = authorization.replace("Bearer ", "");
    UUID userId = jwtUtil.getUserIdFromToken(token);
    UserResponse response = authService.getProfile(userId);
    return ResponseEntity.ok(response);
}
```
Returns: `{id, email, fullName, phone, role, isActive, createdAt, updatedAt}`

### Seed/Demo User
**No seed data or demo users exist in the codebase.** The frontend login page has pre-filled defaults:
- Email: `demo@seatguard.com`
- Password: `DemoPass123!`
But this user must be registered first via the API.

### OAuth2 Dependencies
**❌ No OAuth2 dependencies exist in `pom.xml`:**
- No `spring-boot-starter-oauth2-client`
- No `spring-boot-starter-oauth2-resource-server`
- No `spring-security-oauth2` anything

### Auth Service Dependencies (`pom.xml`)
- `spring-boot-starter-web`
- `spring-boot-starter-security`
- `spring-boot-starter-data-jpa`
- `postgresql`
- `spring-boot-starter-validation`
- `spring-boot-starter-actuator`
- `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (0.12.5)

### Auth Service Config (`application.yml`)
```yaml
server:
  port: 8081
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/seatguard_auth
    username: ${DB_USERNAME:seatguard}
    password: ${DB_PASSWORD:CHANGE_ME}
  jpa:
    hibernate:
      ddl-auto: update
```
**⚠️ `ddl-auto: update`** — auto-creates/updates schema. No Flyway/Liquibase migrations.

### Key Findings — Auth Service
- ❌ **No OAuth2 support** (no dependencies, no config, no endpoints)
- ❌ **No `oauth2_client_registration` table** or entity
- ❌ **No social login flow** (no Google, GitHub, etc.)
- ✅ Password-based auth works (BCrypt + JWT)
- ✅ Refresh token rotation implemented
- ✅ Role enum exists (USER, ADMIN, STAFF)
- ⚠️ All users register as `Role.USER` — no admin promotion mechanism
- ⚠️ JWT secret has a default value (not required to set)
- ⚠️ No email verification on register
- ⚠️ No rate limiting on login/register

---

## 5. Event Service Inspection

### Event Controller (`EventController.java`)

| Method | Path | Auth? | Description |
|---|---|---|---|
| POST | `/api/events` | Should be (TODO) | Create event |
| PUT | `/api/events/{id}` | Should be | Update event |
| GET | `/api/events/{id}` | No | Get event |
| GET | `/api/events` | No | List events |
| POST | `/api/events/{id}/publish` | Should be | Publish event |
| POST | `/api/events/{id}/sections` | Should be | Add section |
| GET | `/api/events/{id}/sections` | No | List sections |
| POST | `/api/events/{id}/seats/generate` | Should be | Generate seats |
| GET | `/api/events/{id}/seat-map` | No | Get seat map |

### Security Handling
**❌ NO security at all.** The event-service:
- Has no Spring Security dependency in `pom.xml`
- Has no `SecurityConfig` class
- Has no JWT validation
- Has no authentication filter
- Trusts all requests blindly

### Create Event — Hardcoded User
```java
@PostMapping
public ResponseEntity<ApiResponse<EventResponse>> createEvent(
        @Valid @RequestBody CreateEventRequest request) {
    // TODO: get createdBy from JWT token in header
    UUID createdBy = UUID.fromString("00000000-0000-0000-0000-000000000000");
    EventResponse response = eventService.createEvent(request, createdBy);
    return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok("Event created", response));
}
```
**⚠️ `createdBy` is hardcoded to null UUID.** No user context from JWT.

### Event Service Dependencies (`pom.xml`)
- `spring-boot-starter-web`
- `spring-boot-starter-data-jpa`
- `postgresql`
- `spring-boot-starter-validation`
- `spring-boot-starter-actuator`
- **NO Spring Security**
- **NO JWT libraries**

### Key Findings — Event Service
- ❌ **No authentication or authorization**
- ❌ **No security dependency at all**
- ❌ `createdBy` hardcoded to zero UUID
- ❌ No admin-only restriction on create/update/delete/publish
- ❌ Does not read `X-User-Id` header or JWT
- ⚠️ Anyone can create, update, publish events without auth

---

## 6. Booking Service Inspection

### Booking Controller (`BookingController.java`)

| Method | Path | Auth? | Description |
|---|---|---|---|
| POST | `/api/bookings/hold` | Partial (X-User-Id header) | Hold seat |
| POST | `/api/bookings/{id}/pay` | No | Confirm payment |
| POST | `/api/bookings/{id}/cancel` | Partial | Cancel booking |
| GET | `/api/bookings/{id}` | No | Get booking |
| GET | `/api/bookings/me` | Partial | Get user bookings |

### User Context
```java
@PostMapping("/hold")
public ResponseEntity<ApiResponse<BookingResponse>> holdSeat(
        @Valid @RequestBody HoldBookingRequest request,
        @RequestHeader(value = "X-User-Id", required = false) String userIdHeader) {
    // TODO: Extract userId from JWT token in production
    UUID userId = userIdHeader != null ? UUID.fromString(userIdHeader) : UUID.randomUUID();
    ...
}
```
**⚠️ Falls back to random UUID if no header.** Trusts `X-User-Id` header blindly.

### Key Findings — Booking Service
- ❌ **No authentication or authorization**
- ❌ **No security dependency**
- ⚠️ Trusts `X-User-Id` header (spoofable)
- ⚠️ Falls back to random UUID (no error on missing user)
- ⚠️ Anyone can pay for anyone's booking

---

## 7. Ticket Service Inspection

### Ticket Controller (`TicketController.java`)

| Method | Path | Auth? | Description |
|---|---|---|---|
| GET | `/api/tickets/me` | Partial (X-User-Id) | Get user tickets |
| GET | `/api/tickets/{id}` | No | Get ticket |
| POST | `/api/tickets/{id}/check-in` | No | Check in by ID |
| POST | `/api/tickets/check-in/by-code` | No | Check in by code |

### User Context
```java
@GetMapping("/me")
public ResponseEntity<ApiResponse<List<TicketResponse>>> getUserTickets(
        @RequestHeader("X-User-Id") UUID userId) {  // Required!
    ...
}
```
**Requires `X-User-Id` header** (not optional here, unlike booking-service).

### Key Findings — Ticket Service
- ❌ **No authentication or authorization**
- ❌ **No security dependency**
- ⚠️ Trusts `X-User-Id` header (spoofable)
- ⚠️ Anyone can view anyone's tickets with forged header
- ⚠️ Check-in endpoints are completely open

---

## 8. Notification Service Inspection

### Tech Stack
- NestJS 10 + TypeScript
- TypeORM + PostgreSQL
- KafkaJS (Kafka consumer)
- Socket.IO (WebSocket)

### Architecture
```
Kafka topics: booking-events, ticket-events
  ↓
KafkaConsumerService → parses events → creates notifications
  ↓
NotificationService → stores in DB + emits via WebSocket
```

### Event Types Handled
- BOOKING_HELD, BOOKING_CONFIRMED, BOOKING_EXPIRED, BOOKING_CANCELLED, BOOKING_PAYMENT_FAILED
- TICKET_ISSUED, TICKET_USED

### Key Findings — Notification Service
- ❌ No authentication on WebSocket connections
- ❌ No authentication on REST endpoints (implied by no guards)
- ✅ Kafka consumer working correctly
- ⚠️ CORS origin: `*` (wildcard)

---

## 9. Frontend Inspection

### Tech Stack
- Next.js 14 (App Router, standalone output)
- TypeScript + Tailwind CSS
- No auth library (custom localStorage-based)

### API Client (`frontend/lib/api.ts`)
- All requests go through Next.js rewrites to API Gateway
- JWT stored in `localStorage`
- `X-User-Id` header sent from `localStorage`
- No SSR auth (client-side only)

### Next.js Rewrites (`next.config.js`)
```js
async rewrites() {
    return [
      { source: '/api/:path*', destination: `${gatewayUrl}/api/:path*` },
    ];
}
```
**Frontend proxies `/api/*` to API Gateway.**

### Frontend Environment (from `docker-compose.full.yml`)
```yaml
NEXT_PUBLIC_AUTH_URL: http://localhost:8081
NEXT_PUBLIC_EVENT_URL: http://localhost:8082
NEXT_PUBLIC_BOOKING_URL: http://localhost:8083
NEXT_PUBLIC_TICKET_URL: http://localhost:8084
```
**⚠️ These env vars are set but NOT used.** The `api.ts` client uses Next.js rewrites (relative paths), not direct service URLs. The `NEXT_PUBLIC_*` vars are dead config.

### Login Page (`frontend/app/login/page.tsx`)
- Only email/password login form
- Pre-filled with `demo@seatguard.com` / `DemoPass123!`
- No OAuth/Google login button
- No social login UI

### Key Findings — Frontend
- ❌ No OAuth login UI
- ❌ No Google Sign-In button
- ⚠️ JWT in localStorage (XSS vulnerable)
- ⚠️ `X-User-Id` header sent client-side (spoofable)
- ⚠️ Dead `NEXT_PUBLIC_*` env vars

---

## 10. Docker Compose Full Stack

### Service Ports

| Service | Container Port | Host Port | Tech |
|---|---|---|---|
| PostgreSQL 16 | 5432 | 5432 | Infra |
| Redis 7 | 6379 | 6379 | Infra |
| Kafka 3.7 (KRaft) | 9092 | 9092 | Infra |
| API Gateway | 8080 | 8080 | Spring Cloud Gateway |
| Auth Service | 8081 | 8081 | Spring Boot |
| Event Service | 8082 | 8082 | Spring Boot |
| Booking Service | 8083 | 8083 | Spring Boot |
| Ticket Service | 8084 | 8084 | Spring Boot |
| Notification Service | 3000 | 3000 | NestJS |
| Frontend | 3001 | 3001 | Next.js |

### Databases
- `seatguard_auth` — auth-service
- `seatguard_event` — event-service
- `seatguard_booking` — booking-service
- `seatguard_ticket` — ticket-service
- `seatguard_notification` — notification-service

### Environment Variables (auth-service in Docker)
```yaml
DB_HOST: postgres
SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/seatguard_auth
SPRING_DATASOURCE_USERNAME: seatguard
SPRING_DATASOURCE_PASSWORD: CHANGE_ME
```
**⚠️ No JWT_SECRET, no OAuth env vars set in Docker.**

---

## 11. Proof/Log Routes

### Frontend `/proof` Page (`frontend/app/proof/page.tsx`)
- Static integration proof page
- Shows key metrics: 7/7 build, 10/10 services, 22/22 API tests
- Shows Kafka event flow diagram
- Shows k6 load test results (14,374 requests, 1 successful booking)
- Shows API test results (all endpoints)
- Lists service ports: :8080-:8085

### Backend Endpoints Used by Proof
All standard endpoints — no special proof-specific endpoints.

---

## 12. Secrets Search

### Findings
```
./.env:3:GOOGLE_CLIENT_SECRET=***REDACTED***
```

**⚠️ CRITICAL: Google OAuth client secret is in `.env` file at project root.**

### `.env` Contents
```
GOOGLE_CLIENT_ID=***REDACTED***
GOOGLE_CLIENT_SECRET=***REDACTED***
GOOGLE_REDIRECT_URI=http://206.189.47.198:8080/login/oauth2/code/google
ADMIN_EMAILS=tansang06092004@gmail.com
```

**Status of these secrets:**
- ❌ `.env` is in `.gitignore` (good) BUT the secret is in the file
- ❌ `GOOGLE_CLIENT_SECRET` is **NOT referenced anywhere in the Java codebase**
- ❌ `GOOGLE_CLIENT_ID` is **NOT referenced anywhere in the Java codebase**
- ❌ `GOOGLE_REDIRECT_URI` points to `http://206.189.47.198:8080/login/oauth2/code/google` — this path is **NOT routed by the gateway**
- ❌ `ADMIN_EMAILS` is **NOT referenced anywhere in the Java codebase**
- ⚠️ These appear to be **prepared for future OAuth implementation** but not yet integrated

---

## 13. Direct Service/Port References

### Hardcoded Service URLs in Code
```
# Gateway config (Docker internal)
auth-service:8081, event-service:8082, booking-service:8083, ticket-service:8084

# Frontend proof page (display only)
:8081, :8082, :8083, :8084

# Reports/docs
localhost:8081, localhost:8082, localhost:8083, localhost:8084
```

### Key Findings
- Gateway uses Docker service names (correct for Docker networking)
- Frontend has dead `NEXT_PUBLIC_*_URL` env vars pointing to direct service ports
- No service-to-service auth (all internal calls are unauthenticated)

---

## 14. Summary of Critical Gaps for OAuth + RBAC Implementation

### What EXISTS ✅
1. Role enum: `USER`, `ADMIN`, `STAFF`
2. User entity with `role` field
3. JWT infrastructure (generation, validation, claims include role)
4. Spring Security config (stateless, JWT filter)
5. `.env` with Google OAuth credentials (client ID, secret, redirect URI)
6. `ADMIN_EMAILS` list in `.env`
7. BCrypt password hashing
8. Refresh token rotation
9. Gateway routing for all API paths
10. Kafka event bus for notifications

### What's MISSING ❌
1. **OAuth2 dependencies** — no `spring-boot-starter-oauth2-client` or `spring-boot-starter-oauth2-resource-server`
2. **OAuth2 endpoints** — no `/oauth2/**` or `/login/oauth2/**` routes in gateway
3. **OAuth2 user entity** — no `oauth_provider`, `oauth_id` fields on User
4. **OAuth2 login flow** — no Google login controller/service
5. **Admin authorization** — no role-based access control on any endpoint
6. **Gateway auth filter** — no JWT validation at gateway level
7. **Service-to-service auth** — no mTLS, no service tokens
8. **Admin role promotion** — no mechanism to make a user ADMIN
9. **`/api/auth/me` role checking** — returns role but no enforcement
10. **Event/Booking/Ticket security** — these services have zero auth

### Architecture Gaps
- Gateway doesn't validate JWT → any request reaches services
- Services don't validate JWT → they trust headers blindly
- `X-User-Id` header is client-set → trivially spoofable
- No admin guard on event CRUD, publish, section management
- No CSRF protection (stateless API, but no refresh token cookie)

---

## 15. File Inventory (Source Files Only)

### Backend — api-gateway
```
backend/api-gateway/src/main/java/com/seatguard/gateway/SeatGuardGatewayApplication.java
backend/api-gateway/src/main/resources/application.yml
backend/api-gateway/pom.xml
```

### Backend — auth-service
```
backend/auth-service/src/main/java/com/seatguard/auth/
├── AuthServiceApplication.java
├── config/SecurityConfig.java
├── controller/AuthController.java, GlobalExceptionHandler.java
├── dto/AuthResponse.java, LoginRequest.java, RegisterRequest.java, UserResponse.java, RefreshRequest.java
├── entity/User.java, Role.java, RefreshToken.java
├── exception/EmailAlreadyExistsException.java, InvalidCredentialsException.java
├── repository/UserRepository.java, RefreshTokenRepository.java
├── security/JwtUtil.java, JwtAuthenticationFilter.java, PasswordUtil.java
└── service/AuthService.java
backend/auth-service/src/main/resources/application.yml
backend/auth-service/pom.xml
```

### Backend — event-service
```
backend/event-service/src/main/java/com/seatguard/event/
├── EventServiceApplication.java
├── controller/EventController.java, GlobalExceptionHandler.java, HealthController.java
├── dto/CreateEventRequest.java, CreateSectionRequest.java, GenerateSeatsRequest.java, EventResponse.java, SectionResponse.java, SeatMapResponse.java, ApiResponse.java
├── entity/Event.java, EventStatus.java, Section.java, Seat.java, SeatStatus.java
├── exception/ResourceNotFoundException.java, InvalidEventStateException.java
├── repository/EventRepository.java, SectionRepository.java, SeatRepository.java
└── service/EventService.java
backend/event-service/src/main/resources/application.yml
backend/event-service/pom.xml
```

### Backend — booking-service
```
backend/booking-service/src/main/java/com/seatguard/booking/
├── BookingServiceApplication.java
├── config/RedisConfig.java
├── controller/BookingController.java, GlobalExceptionHandler.java
├── dto/HoldBookingRequest.java, PayBookingRequest.java, BookingResponse.java, ApiResponse.java
├── entity/Booking.java, BookingStatus.java
├── exception/DuplicateBookingException.java, InvalidBookingStateException.java, ResourceNotFoundException.java
├── repository/BookingRepository.java
└── service/BookingService.java, BookingEventProducer.java, RedisLockService.java
backend/booking-service/src/main/resources/application.yml
backend/booking-service/pom.xml
```

### Backend — ticket-service
```
backend/ticket-service/src/main/java/com/seatguard/ticket/
├── TicketServiceApplication.java
├── controller/TicketController.java, GlobalExceptionHandler.java
├── dto/TicketResponse.java, CheckInResponse.java, CheckInRequest.java, ApiResponse.java
├── entity/Ticket.java, TicketStatus.java
├── exception/TicketNotFoundException.java, TicketAlreadyUsedException.java
├── repository/TicketRepository.java
└── service/TicketService.java, BookingEventConsumer.java
backend/ticket-service/src/main/resources/application.yml
backend/ticket-service/pom.xml
```

### Notification Service (NestJS)
```
notification-service/src/
├── app.module.ts
├── config/app.config.ts
├── health/health.controller.ts, health.module.ts
├── main.ts
└── notification/
    ├── controllers/notification.controller.ts
    ├── dto/notification-response.dto.ts
    ├── entities/notification.entity.ts
    ├── notification.module.ts
    └── services/kafka-consumer.service.ts, notification.service.ts
    └── websocket/notification.gateway.ts
notification-service/package.json
```

### Frontend (Next.js)
```
frontend/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── events/page.tsx, [id]/page.tsx
│   ├── login/page.tsx
│   ├── proof/page.tsx
│   └── tickets/page.tsx
├── components/
│   ├── Navbar.tsx, EventCard.tsx, SeatMap.tsx, TicketCard.tsx
│   ├── LoadingState.tsx, EmptyState.tsx, ErrorState.tsx, StatusBadge.tsx
├── lib/api.ts, utils.ts
├── next.config.js, package.json, tsconfig.json
```

---

## 16. Database Schema (from JPA entities)

### seatguard_auth
- `users` — id(UUID), email, passwordHash, fullName, phone, role(enum), isActive, createdAt, updatedAt
- `refresh_tokens` — id(UUID), user_id(FK), tokenHash, expiresAt, revoked, createdAt

### seatguard_event
- `events` — id(UUID), name, description, venue, category, startTime, endTime, status(DRAFT/PUBLISHED), createdBy(UUID), createdAt, updatedAt
- `sections` — id(UUID), name, description, price(BigDecimal), capacity(int), event_id(FK)
- `seats` — id(UUID), section_id(FK), rowLabel, seatNumber, status(AVAILABLE/HELD/SOLD)

### seatguard_booking
- `bookings` — id(UUID), userId, eventId, seatId, status(PENDING_PAYMENT/CONFIRMED/CANCELLED/EXPIRED), amount, idempotencyKey, createdAt, updatedAt

### seatguard_ticket
- `tickets` — id(UUID), bookingId, userId, seatId, eventId, status(VALID/USED/CANCELLED), checkInCode, qrCode, createdAt, updatedAt

### seatguard_notification
- `notifications` — (TypeORM auto-generated from entity)

---

## 17. Frontend API Routes (from `lib/api.ts`)

| Function | Method | Path | Auth? |
|---|---|---|---|
| `register()` | POST | `/api/auth/register` | No |
| `login()` | POST | `/api/auth/login` | No |
| `getProfile()` | GET | `/api/auth/me` | JWT |
| `listEvents()` | GET | `/api/events?size=100` | No |
| `getEvent()` | GET | `/api/events/{id}` | No |
| `createEvent()` | POST | `/api/events` | JWT (in header) |
| `addSection()` | POST | `/api/events/{id}/sections` | JWT |
| `generateSeats()` | POST | `/api/events/{id}/seats/generate` | JWT |
| `publishEvent()` | POST | `/api/events/{id}/publish` | JWT |
| `getSeatMap()` | GET | `/api/events/{id}/seat-map` | No |
| `holdSeat()` | POST | `/api/bookings/hold` | JWT + X-User-Id |
| `payBooking()` | POST | `/api/bookings/{id}/pay` | JWT |
| `getMyTickets()` | GET | `/api/tickets/me` | JWT + X-User-Id |
| `checkInTicket()` | POST | `/api/tickets/{id}/check-in` | JWT |

**Note:** Frontend sends both `Authorization: Bearer <token>` and `X-User-Id: <userId>` headers. Services only check `X-User-Id`, not JWT.

---

*End of Phase 1 Inspection Report*
