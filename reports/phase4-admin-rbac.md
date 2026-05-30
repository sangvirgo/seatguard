# Phase 4 — Admin RBAC Implementation

**Date:** 2026-05-30
**Branch:** `feature/backend-google-oauth-admin-rbac`

## Summary

Added Spring Security + JWT authentication to event-service, booking-service, and ticket-service. Implemented role-based access control with ADMIN restriction on event management.

## Changes Made

### Event Service
- **pom.xml**: Added `spring-boot-starter-security`, `jjwt-api/impl/jackson` dependencies
- **SecurityConfig.java** (new): JWT filter, stateless session, GET endpoints public, POST/PUT/DELETE require auth, `@EnableMethodSecurity`
- **JwtUtil.java** (new): Token validation, extract userId/email/role
- **JwtAuthenticationFilter.java** (new): Extract JWT from Authorization header, set SecurityContext
- **EventController.java**: Added `@PreAuthorize("hasRole('ADMIN')")` on createEvent, updateEvent, publishEvent, addSection, generateSeats. Changed `createdBy` from hardcoded zero UUID to `getCurrentUserId()` from SecurityContext
- **GlobalExceptionHandler.java**: Added `AccessDeniedException` handler returning 403
- **application.yml**: Added `jwt.secret` config

### Booking Service
- **pom.xml**: Added Spring Security + JWT dependencies
- **SecurityConfig.java** (new): JWT filter, all endpoints require auth
- **JwtUtil.java** (new): Token validation
- **JwtAuthenticationFilter.java** (new): JWT extraction
- **BookingController.java**: Removed `X-User-Id` header, using `getCurrentUserId()` from SecurityContext
- **application.yml**: Added `jwt.secret` config

### Ticket Service
- **pom.xml**: Added Spring Security + JWT dependencies
- **SecurityConfig.java** (new): JWT filter, all endpoints require auth
- **JwtUtil.java** (new): Token validation
- **JwtAuthenticationFilter.java** (new): JWT extraction
- **TicketController.java**: Removed `X-User-Id` header, using `getCurrentUserId()` from SecurityContext
- **application.yml**: Added `jwt.secret` config

### Frontend
- **lib/api.ts**: Removed `X-User-Id` header from API client (security fix - was spoofable)

### Docker
- **docker-compose.full.yml**: Added `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `ADMIN_EMAILS` env vars to services

## Test Results

| Test | Result |
|------|--------|
| USER create event | ✅ 403 Forbidden |
| ADMIN create event | ✅ 201 Created |
| GET /api/events (public) | ✅ 200 OK |
| GET /api/bookings/me (auth) | ✅ 200 OK |
| GET /api/tickets/me (auth) | ✅ 200 OK |
| All services compile | ✅ Pass |
