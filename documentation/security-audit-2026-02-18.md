# Security Audit – 2026-02-18

## Scope
- Reviewed authentication and authorization flows in `app/api/*`, staff room server actions, and Supabase admin usage.
- Searched for high-risk patterns (`dangerouslySetInnerHTML`, service-role usage, and server actions missing permission checks).
- Attempted dependency vulnerability audit with `npm audit`.

## Findings

### 1) Broken access control in room management server actions (**High**, fixed)
**Issue:** Multiple room management server actions did not enforce explicit staff authorization before reading/updating/deleting room resources.

**Risk:** Authenticated users could potentially invoke server actions against room IDs they should not control (depends on RLS/policy behavior, but server-side defense-in-depth was missing).

**Fixed in this patch:**
- Added centralized profile-auth helper and room-level authorization helper.
- Enforced org status + staff access checks in:
  - `updateRoom`
  - `deleteRoom`
  - `getRoomTimeSlotRules`
  - `createRoomTimeSlotRule`
  - `deleteRoomTimeSlotRule`

---

### 2) Stored XSS risk from unsanitized HTML rendering (**High**, open)
**Issue:** Activity descriptions are rendered using `dangerouslySetInnerHTML` in user/staff-facing pages without visible sanitization at render-time.

**Risk:** If rich text input is not sanitized before persistence, malicious HTML/JS payloads could execute in end-user browsers.

**Recommendation:**
- Sanitize HTML at ingestion and/or before render using a strict allow-list sanitizer.
- Consider rendering trusted markdown/plain text instead of raw HTML where possible.

---

### 3) CSRF hardening gaps on sensitive POST endpoints (**Medium**, open)
**Issue:** Sensitive authenticated POST endpoints (password change/account deletion) do not validate `Origin`/`Referer` or anti-CSRF tokens.

**Risk:** Depending on deployment cookie settings and browser behavior, CSRF remains a potential attack vector.

**Recommendation:**
- Add CSRF token verification and strict same-origin checks.
- Ensure auth cookies are `SameSite=Strict` where feasible.

---

### 4) Account deletion consistency/atomicity risk (**Medium**, open)
**Issue:** Account deletion performs many admin deletes sequentially but does not verify each deletion result before proceeding.

**Risk:** Partial deletion can leave orphaned data / inconsistent state if an intermediate statement fails.

**Recommendation:**
- Execute deletion in a database function/transaction with explicit error handling and rollback semantics.
- Surface failures with actionable logs.

## Dependency Audit Status
- `npm audit --omit=dev` could not complete due npm advisory endpoint access denial (`403 Forbidden`) in this environment.
