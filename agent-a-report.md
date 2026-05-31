# Agent A — Layout Inspector Report

## 1. Project Structure Overview

**Branch:** `main` (clean working tree)

### Source Files (excluding `.next/` and `node_modules/`)

```
frontend/
├── app/
│   ├── layout.tsx              ← Root layout
│   ├── globals.css             ← Global CSS
│   ├── page.tsx                ← Homepage
│   ├── admin/page.tsx          ← Admin dashboard
│   ├── events/page.tsx         ← Events listing page
│   ├── events/[id]/page.tsx    ← Event detail page
│   ├── login/page.tsx          ← Login page
│   ├── auth/callback/page.tsx  ← OAuth2 callback
│   ├── payment/result/page.tsx ← Payment result
│   ├── proof/page.tsx          ← Engineering proof
│   └── tickets/page.tsx        ← My Tickets
├── components/
│   ├── EventCard.tsx
│   ├── Navbar.tsx
│   ├── SeatMap.tsx
│   ├── StatusBadge.tsx
│   ├── TicketCard.tsx
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   └── LoadingState.tsx
├── lib/
│   ├── api.ts                  ← API client
│   └── utils.ts                ← cn() utility
├── next.config.js
├── postcss.config.js
└── package.json
```

---

## 2. Exact Homepage Files Found

| File | Path |
|------|------|
| **Root Layout** | `frontend/app/layout.tsx` |
| **Global CSS** | `frontend/app/globals.css` |
| **Homepage** | `frontend/app/page.tsx` |
| **Event Card** | `frontend/components/EventCard.tsx` |
| **Navbar** | `frontend/components/Navbar.tsx` |

---

## 3. Exact Admin Files Found

| File | Path |
|------|------|
| **Admin Page** | `frontend/app/admin/page.tsx` |
| **Events Page** (also has admin features) | `frontend/app/events/page.tsx` |
| **API Client** | `frontend/lib/api.ts` |
| **Backend EventController** | `backend/event-service/.../controller/EventController.java` |
| **Backend EventService** | `backend/event-service/.../service/EventService.java` |

---

## 4. Root Cause of Left Shift (Content Starting at x=0)

### Analysis

**HTML/Body structure** (`layout.tsx`):
```tsx
<html lang="en">
  <body className="flex min-h-screen flex-col bg-gradient-hero text-gray-200 antialiased">
    <Navbar />
    <main className="flex-1">{children}</main>
  </body>
</html>
```

**Global CSS** (`globals.css`):
```css
body {
  overflow-x: hidden;  /* ← Only on body, NOT on html */
}
```

### Root Cause: `overflow-x: hidden` missing on `<html>`

The hero section in `page.tsx` creates **very wide absolute-positioned glow effects**:
```tsx
<div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/12 rounded-full blur-[140px]" />
<div className="pointer-events-none absolute top-32 left-1/4 w-[500px] h-[350px] bg-violet-600/10 rounded-full blur-[120px]" />
<div className="pointer-events-none absolute top-16 right-1/4 w-[350px] h-[250px] bg-pink-600/8 rounded-full blur-[100px]" />
```

These elements are wider than the viewport. In most browsers, `overflow-x: hidden` on `<body>` alone does **NOT** prevent the `<html>` element from creating a horizontal scrollbar. The `<html>` element still sees the overflow.

**The fix:** Add `overflow-x: hidden` to the `<html>` element (either in CSS or as a class).

### Secondary Issue: Inconsistent Container Approaches

The codebase mixes **two different centering patterns**:

1. **Tailwind utilities** (used in homepage, events page, navbar, footer):
   ```
   mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8
   ```

2. **Custom `.container-main` class** (used in admin page header, event detail, proof, tickets):
   ```css
   .container-main {
     margin-left: auto;
     margin-right: auto;
     width: 100%;
     max-width: 80rem;   /* = max-w-7xl */
     padding-left: 1rem;
     padding-right: 1rem;
   }
   ```

Both produce the same `max-width: 80rem (1280px)` with responsive padding. The inconsistency is cosmetic but makes maintenance harder.

---

## 5. Whether Body/HTML/Global CSS Causes Overflow

**YES.** Here's the chain:

1. **`<html>`** — No overflow control. Default `overflow: visible`.
2. **`<body>`** — Has `overflow-x: hidden` but this is insufficient.
3. **Hero glow divs** — Absolute positioned, `w-[900px]`, `w-[500px]`, `w-[350px]` with `left-1/2 -translate-x-1/2`. These push content width beyond viewport.
4. **Admin header glow** — Same pattern: `w-[600px]` with `left-1/2 -translate-x-1/2`.

**Result:** The `<html>` element gets a horizontal scrollbar (even though `<body>` hides it). This can cause:
- The entire page to shift left when a scrollbar appears
- Content to appear flush against the left edge

---

## 6. Whether Components Use Container Inconsistently

**YES.** Mixed patterns found:

| Component/File | Pattern Used |
|---|---|
| `app/page.tsx` (homepage) | `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8` |
| `components/Navbar.tsx` | `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8` |
| `app/admin/page.tsx` (header) | `.container-main` (custom class) |
| `app/admin/page.tsx` (body) | `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` |
| `app/events/page.tsx` (hero) | `.container-main` |
| `app/events/page.tsx` (body) | `.container-main` |
| `app/events/[id]/page.tsx` | `.container-main` |
| `app/proof/page.tsx` | `.container-main` |
| `app/tickets/page.tsx` | `.container-main` |

**The admin page is the worst offender** — it uses BOTH `.container-main` AND `max-w-7xl mx-auto px-4` in the same page.

---

## 7. Why Admin Events Count/List Is Empty — Full Data Flow Trace

### Data Flow

```
Admin page loadEvents()
  → listEvents() in lib/api.ts
    → apiFetch('/api/events?size=100')
      → Next.js rewrite: /api/events → http://event-service:8082/api/events
        → EventController.listEvents()
          → eventService.listPublishedEvents(category, search, pageRequest)
            → eventRepository.findByStatus(EventStatus.PUBLISHED, pageable)
```

### Root Cause: Backend only returns PUBLISHED events

The `listEvents` API endpoint in `EventController.java` (line ~62):
```java
@GetMapping
public ResponseEntity<ApiResponse<Page<EventResponse>>> listEvents(...) {
    Page<EventResponse> events = eventService.listPublishedEvents(category, search, pageRequest);
    return ResponseEntity.ok(ApiResponse.ok(events));
}
```

The `listPublishedEvents` method in `EventService.java` (line ~72):
```java
public Page<EventResponse> listPublishedEvents(String category, String search, Pageable pageable) {
    // ... all paths filter by EventStatus.PUBLISHED
    return eventRepository.findByStatus(EventStatus.PUBLISHED, pageable)
            .map(EventResponse::from);
}
```

**This means:**
1. When admin creates an event → it's `DRAFT` status
2. Admin adds section → still `DRAFT`
3. Admin generates seats → still `DRAFT`
4. Admin publishes → becomes `PUBLISHED`
5. **But** `listEvents()` only returns `PUBLISHED` events
6. If an admin creates an event but hasn't published yet, or if there are zero published events → the admin table shows "No events found"

### Frontend Response Parsing

In `lib/api.ts`:
```typescript
export async function listEvents() {
  const res = await apiFetch('/api/events?size=100');
  return res.ok ? (res.data.data?.content || res.data.content || []) : [];
}
```

The backend returns `ApiResponse<Page<EventResponse>>` where:
- `res.data` = `{ success, message, data, timestamp }`
- `res.data.data` = Spring `Page<EventResponse>` object
- `res.data.data.content` = the actual array of events

The parsing `res.data.data?.content || res.data.content || []` handles this correctly.

### Why Events List Is Empty

**Most likely:** There are zero events with `PUBLISHED` status in the database. All created events remain in `DRAFT` state. The admin dashboard has no endpoint to list ALL events (including DRAFT).

**There is NO admin-specific list endpoint.** The same `GET /api/events` is used by both public users and admins, and it always filters to `PUBLISHED` only.

---

## 8. Why Upload Image Button/List Is Missing

### In Admin Page (`admin/page.tsx`)

The upload button **IS coded** in the events table (lines ~400-420):
```tsx
<td className="py-3 px-3">
  <div className="flex items-center gap-2">
    {e.coverImageUrl && (
      <img src={e.coverImageUrl} alt={e.name} ... />
    )}
    <label className="... cursor-pointer ...">
      {uploading ? '...' : e.coverImageUrl ? 'Replace' : 'Upload'}
      <input type="file" accept="image/jpeg,image/png,image/webp"
             onChange={(ev) => handleImageUpload(ev, e.id)} className="hidden" />
    </label>
  </div>
</td>
```

**But this only renders inside the `events.map()` loop**, which requires `events.length > 0`. Since the events list is empty (see §7), the table body never renders, so the upload buttons are invisible.

### In Events Page (`events/page.tsx`)

The admin upload section (lines ~143-168):
```tsx
{isAdmin && events.length > 0 && (
  <div className="mb-8 glass-card p-5">
    <h3>📸 Upload Event Image (Admin)</h3>
    <select>...event options...</select>
    <label>Choose Image</label>
  </div>
)}
```

**Same problem:** `events.length > 0` guard means this section is hidden when there are no events.

### Root Cause Summary

The upload functionality exists in code but is **invisible because:**
1. `listEvents()` only returns PUBLISHED events
2. If no PUBLISHED events exist → `events = []`
3. Both admin page table and events page upload section require `events.length > 0`
4. Result: upload UI is never rendered

---

## 9. Recommended Files to Edit with Specific Line Numbers

### Fix 1: Left Shift — Add `overflow-x: hidden` to `<html>`

**File:** `frontend/app/globals.css` — Line 10-12
```css
/* Current: */
html {
  scroll-behavior: smooth;
}

/* Change to: */
html {
  scroll-behavior: smooth;
  overflow-x: hidden;
}
```

### Fix 2: Consistent Container — Replace `.container-main` usage with Tailwind utilities

**Files to update:**

| File | Line(s) | Current | Replace With |
|---|---|---|---|
| `frontend/app/admin/page.tsx` | Line 224 | `className="container-main relative z-10"` | `className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10"` |
| `frontend/app/events/page.tsx` | Line 97 | `className="container-main relative z-10"` | `className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10"` |
| `frontend/app/events/page.tsx` | Line 113 | `className="container-main"` | `className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"` |
| `frontend/app/events/[id]/page.tsx` | Lines 111, 140 | `className="container-main ..."` | Replace with Tailwind utilities |
| `frontend/app/proof/page.tsx` | Lines 60, 66 | `className="container-main ..."` | Replace with Tailwind utilities |
| `frontend/app/tickets/page.tsx` | Lines 80, 96 | `className="container-main ..."` | Replace with Tailwind utilities |

**OR** keep `.container-main` but apply it consistently everywhere (including homepage, navbar, footer).

### Fix 3: Admin Events List Empty — Add admin-specific list endpoint or parameter

**Option A (Frontend-only):** Add a `listAllEvents()` function in `lib/api.ts` that includes DRAFT events for admins.

**Option B (Backend):** Add an admin-only endpoint or query parameter:

**File:** `backend/event-service/.../controller/EventController.java` — After line ~64

Add new endpoint:
```java
@GetMapping("/admin/all")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<ApiResponse<Page<EventResponse>>> listAllEvents(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "100") int size) {
    PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
    Page<EventResponse> events = eventService.listAllEvents(pageRequest);
    return ResponseEntity.ok(ApiResponse.ok(events));
}
```

**File:** `backend/event-service/.../service/EventService.java` — Add method:
```java
public Page<EventResponse> listAllEvents(Pageable pageable) {
    return eventRepository.findAll(pageable).map(EventResponse::from);
}
```

**File:** `frontend/lib/api.ts` — Add function after `listEvents`:
```typescript
export async function listAllEvents() {
  const res = await apiFetch('/api/events/admin/all?size=100');
  return res.ok ? (res.data.data?.content || res.data.content || []) : [];
}
```

**File:** `frontend/app/admin/page.tsx` — Line 70:
Change `const evts = await listEvents();` to `const evts = await listAllEvents();`

### Fix 4: Upload Button Visibility — Fix will follow Fix 3

Once the admin events list shows all events (including DRAFT), the upload buttons in both `admin/page.tsx` (line ~400) and `events/page.tsx` (line ~143) will automatically appear since they're inside the events loop.

---

## 10. Additional Findings

### Tailwind v4
The project uses **Tailwind CSS v4** (`"@tailwindcss/postcss": "^4.3.0"`, `"tailwindcss": "^4.3.0"`). This means:
- No `tailwind.config.js` needed (v4 uses CSS-based config via `@theme`)
- The `@import "tailwindcss"` in `globals.css` is the v4 way
- The `container` utility from Tailwind is NOT used — they use custom `.container-main` instead

### API Gateway Rewrites
`next.config.js` rewrites `/api/*` to `http://localhost:8080/api/*`. The API Gateway then routes:
- `/api/events/**` → `event-service:8082`
- `/api/auth/**` → `auth-service:8081`
- `/api/bookings/**` → `booking-service:8083`

### Backend List Events — Only PUBLISHED
The `GET /api/events` endpoint **always** filters by `EventStatus.PUBLISHED`. There is no way for admins to see DRAFT events through this endpoint. This is the core data-flow issue.

### Event Response Fields
The backend `EventResponse` includes: `id, name, description, venue, category, startTime, endTime, status, coverImageUrl, createdAt`. The frontend correctly maps these.
