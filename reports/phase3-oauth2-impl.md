# Phase 3 — Google OAuth2 Implementation Report

**Date:** 2026-05-30  
**Branch:** `feature/backend-google-oauth-admin-rbac`  
**Status:** ✅ Complete — Compilation Verified

---

## Summary

Implemented Google OAuth2 login flow for SeatGuard auth-service using a manual OAuth2 approach (no Spring Security auto-configuration). Users can now sign in via Google, with automatic account linking for existing email-based accounts and admin role assignment via environment variable.

## Steps Completed

### Step 1: OAuth2 Client Dependency ✅ (Already Present)
- `spring-boot-starter-oauth2-client` was already in `pom.xml`

### Step 2: User Entity ✅ (Already Present)
- `passwordHash` already `@Column(nullable = true)`
- `oauthProvider` and `oauthId` fields already existed

### Step 3: UserRepository — `findByOauthProviderAndOauthId` ✅
**File:** `backend/auth-service/src/main/java/com/seatguard/auth/repository/UserRepository.java`
- Added `Optional<User> findByOauthProviderAndOauthId(String oauthProvider, String oauthId);`

### Step 4: OAuth2Service ✅
**File:** `backend/auth-service/src/main/java/com/seatguard/auth/service/OAuth2Service.java` (new)
- `processGoogleLogin(String email, String name, String googleSub)`:
  1. Looks up user by `(oauthProvider="google", oauthId)` first
  2. Falls back to `findByEmail` — links existing local account if found
  3. Creates new user if neither exists (passwordHash=null, role=USER)
  4. Checks `ADMIN_EMAILS` env var (comma-separated) — upgrades to ADMIN if email matches
  5. Generates JWT access token + refresh token (same pattern as AuthService)
  6. Returns `AuthResponse`

### Step 5: OAuth2Controller ✅
**File:** `backend/auth-service/src/main/java/com/seatguard/auth/controller/OAuth2Controller.java` (new)
- `GET /oauth2/authorization/google` — Builds Google OAuth URL with `GOOGLE_CLIENT_ID`, `GOOGLE_REDIRECT_URI` and redirects user
- `GET /oauth2/callback/google?code=...`:
  1. Exchanges authorization code for tokens via POST to `https://oauth2.googleapis.com/token`
  2. Gets user info from `https://www.googleapis.com/oauth2/v3/userinfo`
  3. Calls `oAuth2Service.processGoogleLogin(email, name, sub)`
  4. Redirects to `http://206.189.47.198:3001/auth/callback?token=***&refreshToken=***`

### Step 6: SecurityConfig ✅
**File:** `backend/auth-service/src/main/java/com/seatguard/auth/config/SecurityConfig.java`
- Added `.requestMatchers("/oauth2/**").permitAll()` to the authorization chain

### Step 7: application.yml ✅ (No Changes Needed)
- Environment variables accessed via `System.getenv()` — no config changes required

### Step 8: Gateway Route ✅
**File:** `backend/api-gateway/src/main/resources/application.yml`
- Added route:
  ```yaml
  - id: auth-service-oauth
    uri: http://auth-service:8081
    predicates: [Path=/oauth2/**]
  ```

### Step 9: Frontend Callback Page ✅
**File:** `frontend/app/auth/callback/page.tsx` (new)
- Reads `token` and `refreshToken` from URL search params
- Stores in localStorage
- Fetches profile to get userId
- Redirects to `/` (home)
- Shows loading spinner during auth

### Step 10: Google Login Button ✅
**File:** `frontend/app/login/page.tsx`
- Added "Continue with Google" button below the login form (login mode only)
- Includes Google "G" SVG icon
- Links to `/oauth2/authorization/google`
- Styled with border/ghost button to match existing design

### Step 11: Compilation ✅
```
cd /root/projects/seatguard/backend/auth-service && mvn clean compile -q
```
- Exit code 0 — all Java files compile successfully

---

## Architecture

```
Browser → GET /oauth2/authorization/google (gateway:8080)
  → auth-service:8081 → 302 redirect to Google

Google → GET /oauth2/callback/google?code=... (gateway:8080)
  → auth-service:8081
    → POST https://oauth2.googleapis.com/token (code exchange)
    → GET https://www.googleapis.com/oauth2/v3/userinfo (user info)
    → OAuth2Service.processGoogleLogin()
    → 302 redirect to frontend with JWT tokens
```

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID | `123456-xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret | `GOCSPX-xxx` |
| `GOOGLE_REDIRECT_URI` | Callback URL registered in Google Console | `http://206.189.47.198:8080/oauth2/callback/google` |
| `ADMIN_EMAILS` | Comma-separated emails for auto-admin role | `admin@example.com,sang@example.com` |

## Security Notes

- No secrets hardcoded — all via `System.getenv()`
- Access token from Google is not stored server-side (only used to fetch user info)
- Refresh tokens are hashed with SHA-256 before storage
- Existing password-based login remains fully functional
- OAuth2 users have `passwordHash=null` (valid for OAuth-only accounts)
