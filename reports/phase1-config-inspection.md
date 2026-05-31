# Phase 1 — Payment Config Hardening Inspection

**Date:** 2026-05-30  
**Scope:** MoMo & VNPay payment provider configuration across Java code, application.yml, docker-compose, and .env.example

---

## 1. How MOMO_ENABLED Is Parsed

| Layer | Expression | Type | Default |
|---|---|---|---|
| `application.yml` | `momo.enabled: ${MOMO_ENABLED:false}` | YAML → Spring property | `false` |
| `MomoPaymentProvider.java` | `@Value("${momo.enabled:false}")` | `boolean` (primitive) | `false` |

**Resolution chain:**
1. Spring resolves `${MOMO_ENABLED:false}` from env/system properties → sets `momo.enabled` property
2. `@Value("${momo.enabled:false}")` reads the resolved `momo.enabled` property
3. Spring's `BooleanConverter` converts the string value to primitive `boolean`

**Default (no env set):** `false` — MoMo is disabled by default.

## 2. How VNPAY_ENABLED Is Parsed

| Layer | Expression | Type | Default |
|---|---|---|---|
| `application.yml` | `vnpay.enabled: ${VNPAY_ENABLED:false}` | YAML → Spring property | `false` |
| `VnpayPaymentProvider.java` | `@Value("${vnpay.enabled:false}")` | `boolean` (primitive) | `false` |

Identical pattern to MoMo. **Default: `false`** — VNPay is disabled by default.

## 3. What Happens When Env Is MISSING

When `MOMO_ENABLED` / `VNPAY_ENABLED` environment variables are **not set at all**:

- `${MOMO_ENABLED:false}` resolves to the default `false`
- `@Value("${momo.enabled:false}")` receives `"false"` → parsed as `boolean false`
- Both providers are instantiated (they are `@Component`) but `enabled = false`
- **Result:** Providers are registered in the Spring context but stay disabled. Payment attempts return failure messages. No crash.

## 4. What Happens When Env Is EMPTY STRING

When `MOMO_ENABLED=""` / `VNPAY_ENABLED=""` (empty string set in environment or `.env`):

- `${MOMO_ENABLED:false}` — In Spring Boot, the default after `:` is used when the property is **completely unresolved**. An empty-string env var IS resolved (to `""`), so the default `false` is **NOT** used.
- `momo.enabled` property becomes `""` (empty string)
- `@Value("${momo.enabled:false}")` on `boolean` primitive → Spring's `BooleanConverter` converts `""` to `false` (via `Boolean.parseBoolean("")` which returns `false`)
- **Result:** `enabled = false`. Same as missing. No crash.

> ⚠️ **Caveat:** While this works in practice, relying on implicit empty-string-to-false conversion is fragile. Explicit `@Value("${momo.enabled:false}")` defaults in Java are the safety net, but the application.yml chain could theoretically behave differently if Spring's property resolution changes. Recommendation: ensure `.env` sets explicit `false` rather than leaving blank.

## 5. What Happens When Provider Is Disabled

Both providers follow the same guard pattern:

```java
// MomoPaymentProvider.initiatePayment() / VnpayPaymentProvider.initiatePayment()
if (!enabled) {
    return PaymentResult.failed("<Provider> sandbox is not configured in this demo environment");
}
```

When disabled:
- The `@Component` bean is **always instantiated** by Spring (no `@ConditionalOnProperty`)
- The provider is **always registered** in `PaymentService.providers` map (via `List<PaymentProvider>` injection)
- Calling `initiatePayment()` returns `PaymentResult.failed(...)` immediately
- `PaymentService.createPayment()` receives the failed result, sets payment status to `FAILED`, and throws `InvalidBookingStateException` with message: `"Payment initiation failed: <Provider> sandbox is not configured in this demo environment"`
- **User-facing behavior:** API returns 400 with a clear error message. No partial state.

## 6. Does App Crash With Missing Credentials When enabled=false?

**No. The app does NOT crash.**

**Evidence:**
- All credential fields have empty-string defaults: `@Value("${momo.partner-code:}")`, `@Value("${vnpay.tmn-code:}")`, etc.
- Both providers are `@Component` — Spring creates them unconditionally (no `@ConditionalOnProperty`)
- The `enabled` guard in `initiatePayment()` returns **before** any credential is used
- Credentials (`partnerCode`, `accessKey`, `secretKey`, `tmnCode`, `hashSecret`) are only referenced inside `initiatePayment()` **after** the `if (!enabled)` early return
- No `@PostConstruct` validation, no eager credential checking

**Safe configuration:** Set `MOMO_ENABLED=false` and `VNPAY_ENABLED=false` → providers are dormant, no credentials needed, no crash.

---

## Additional Findings

### A. All Providers Always Registered (No Conditional Loading)

Both `MomoPaymentProvider` and `VnpayPaymentProvider` use `@Component` without `@ConditionalOnProperty`. This means:
- They are **always** in the Spring context regardless of `enabled` flag
- `PaymentService` always receives all 3 providers (MOCK, MOMO, VNPAY) in its `List<PaymentProvider>`
- The `providers` map always has 3 entries

**Implication:** If someone sends a payment request with method `MOMO` when MoMo is disabled, they get a business-logic error (400), not a "method not found" error. This is acceptable but could be improved with `@ConditionalOnProperty` to completely exclude disabled providers.

### B. Docker Compose Passes Through Env Vars Without Defaults

In `infra/docker-compose.full.yml`, the booking-service section:
```yaml
MOMO_ENABLED: ${MOMO_ENABLED}
VNPAY_ENABLED: ${VNPAY_ENABLED}
```

No inline defaults — relies entirely on `.env` file or host environment. If `.env` is missing these variables, the env vars are empty strings (see Finding #4).

### C. .env.example Defaults Are Correct

`.env.example` ships with:
```
MOMO_ENABLED=false
VNPAY_ENABLED=false
```

This is the correct safe default. New deployments copying `.env.example` to `.env` will have payment providers disabled.

### D. Credential Fields Have No Validation

No `@NotBlank`, `@NotEmpty`, or custom validation on credential fields. If `enabled=true` but credentials are empty/`CHANGE_ME`, the payment will proceed with garbage credentials (producing invalid signatures or failed API calls). This is a TODO area — the current code has placeholder implementation anyway.

---

## Summary Table

| Scenario | MOMO_ENABLED | VNPAY_ENABLED | App Starts? | Payment Works? |
|---|---|---|---|---|
| Env not set | `false` (default) | `false` (default) | ✅ Yes | ❌ Returns failure msg |
| Env = `false` | `false` | `false` | ✅ Yes | ❌ Returns failure msg |
| Env = `""` (empty) | `false` (implicit) | `false` (implicit) | ✅ Yes | ❌ Returns failure msg |
| Env = `true` (no creds) | `true` | — | ✅ Yes | ⚠️ Proceeds with empty creds |
| Env = `true` (with creds) | `true` | — | ✅ Yes | 🔶 Sandbox (TODO impl) |

**Overall Assessment:** The configuration is **safe for disabled state** — no crashes, no credential leaks, clear error messages. The main hardening opportunities are: (1) adding `@ConditionalOnProperty` for cleaner exclusion, (2) adding credential validation when enabled, and (3) handling empty-string env vars more explicitly.
