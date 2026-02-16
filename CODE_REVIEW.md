# Code Review — Shane's Retirement Fund

**Date:** 2026-02-15
**Reviewed by:** Claude (full codebase review)

---

## CRITICAL — Fix Before Production

### 1. Open SSRF Proxy
- **File:** `supabase/functions/test-api/index.ts`
- **Issue:** Unauthenticated edge function acts as an open HTTP proxy. Any anonymous request can make arbitrary server-side requests — including to cloud metadata endpoints (`169.254.169.254`), internal services, and external APIs.
- **Fix:** Add JWT + admin role verification. Implement URL allowlisting. Block private IP ranges. Restrict CORS to app domain. Or delete entirely if not needed in production.

### 2. Unauthenticated Email Sending
- **File:** `supabase/functions/send-email/index.ts`
- **Issue:** No auth check. Anyone can send emails via Resend with arbitrary HTML, arbitrary `from` address, and arbitrary recipients. Enables spam, phishing, and quota exhaustion.
- **Fix:** Add JWT + admin role verification. Hardcode the `from` address. Restrict CORS. Add rate limiting.

### 3. Unauthenticated Database Writes
- **File:** `supabase/functions/fetch-lottery-results/index.ts`
- **Issue:** No auth check. Anyone can trigger lottery data upserts using the service role key. Wildcard CORS.
- **Fix:** Add JWT + admin role verification. Restrict CORS. Remove internal `logs` array from response body.

### 4. Client-Side-Only Admin Authorization
- **File:** `components/admin/AdminLayout.tsx`
- **Issue:** Admin panel gated by a frontend-only `admin_users` table check. If RLS is misconfigured on any admin table (`notifications`, `users`, `api_connections`, `email_templates`, `email_logs`, etc.), any authenticated user can query/mutate data directly.
- **Fix:** Audit RLS policies on every table the admin panel touches. Consider server-side admin middleware.

### 5. API Keys Exposed to Browser
- **File:** `components/admin/ApiTester.tsx`
- **Issue:** `select('*')` on `api_connections` fetches API keys into browser memory. Keys are then sent in the request body to the edge function.
- **Fix:** Never fetch `api_key` column to the frontend. Have the edge function retrieve keys server-side by `connection_id`.

### 6. Incomplete Logout
- **File:** `components/ProfileView.tsx:135`
- **Issue:** Logout only calls `setAuthenticated(false)` in Zustand — does NOT call Supabase `signOut()`. Session token persists, allowing session restoration.
- **Fix:** Call `supabase.auth.signOut()` (or the `signOut` from `useAuth`) before clearing store state.

---

## HIGH — Should Fix Soon

### Architecture & Deduplication

#### 7. Competing Type Systems
- **Files:** `types.ts` vs `types/database.ts`
- **Issue:** `types.ts` defines `User`, `Pool`, `Friend`, `Activity` types that are out of sync with the actual database types in `types/database.ts`. Forces `as any` casts across the codebase.
- **Fix:** Delete `types.ts`. Move `Activity` and `Friend` interfaces into appropriate files. Update all imports to use `types/database.ts`.

#### 8. Broken Duplicate Lottery Service
- **File:** `src/services/lottery.ts`
- **Issue:** Near-exact duplicate of `services/lottery.ts` with syntax errors, broken imports (`src/lib/supabase.ts` doesn't exist), and broken template literals. Cannot compile.
- **Fix:** Delete `src/services/lottery.ts` entirely. Ensure all imports point to `services/lottery.ts`.

#### 9. Duplicate Notification Services
- **Files:** `services/notifications.ts` + `services/notificationService.ts`
- **Issue:** Both define overlapping functions (`markAsRead`, `markAllAsRead`). `notificationService.ts` defines its own `Notification` type that can diverge from `types/database.ts`. Different return patterns.
- **Fix:** Consolidate into one file. Use database types. Standardize on `{ data, error }` return pattern.

#### 10. Duplicate Ticket Creation Functions
- **File:** `services/tickets.ts`
- **Issue:** `createTicket` and `addTicket` both insert into the `tickets` table. Only `addTicket` validates numbers. Callers using `createTicket` bypass validation.
- **Fix:** Remove `createTicket` or make it call `addTicket` internally.

### Security

#### 11. PostgREST Filter Injection
- **File:** `services/friends.ts:462`
- **Issue:** User search input interpolated directly into `.or()` and `.ilike()` filters: `.or(\`display_name.ilike.%${trimmed}%,...\`)`. PostgREST filter syntax in the input could manipulate the query.
- **Fix:** Use Supabase's `.ilike()` method directly instead of string interpolation inside `.or()`.

#### 12. Win-Checking From Client Side
- **File:** `services/lottery.ts` (`checkTicketsForDraw`)
- **Issue:** Writes to the `winnings` table from browser code. Financial data should be processed server-side to prevent manipulation.
- **Fix:** Move win-checking logic to an edge function.

#### 13. Hardcoded Supabase Credentials
- **File:** `lib/supabase.ts`
- **Issue:** URL and anon key hardcoded instead of using `import.meta.env.VITE_*` environment variables.
- **Fix:** Use env vars. Add `.env.example` for documentation.

### Admin Panel

#### 14. Tailwind Dynamic Classes Broken
- **File:** `components/admin/AdminLayout.tsx` (6+ locations)
- **Issue:** Pattern like `` hover:${t.textPrimary} `` inside template literals. Tailwind JIT can't detect dynamically assembled class names — CSS rules are never generated.
- **Fix:** Use a class lookup object with complete strings (e.g., `t.hoverText` = `"hover:text-zinc-100"`).

#### 15. Fetching 10K Rows to Count
- **File:** `components/admin/AdminNotifications.tsx:515`
- **Issue:** Fetches up to 10,000 notification rows to the browser just to count by type in JavaScript.
- **Fix:** Use a database view or RPC with `GROUP BY`.

#### 16. No Confirmation for "Send to All Users"
- **File:** `components/admin/AdminNotifications.tsx:134`
- **Issue:** Mass notification fires immediately with no confirmation dialog.
- **Fix:** Add a confirmation modal before bulk send.

#### 17. String Interpolation Bug
- **File:** `components/admin/AdminNotifications.tsx:304`
- **Issue:** Uses `"..."` (double quotes) instead of backtick template literal. `${t.cardBorder}` renders as literal text.
- **Fix:** Change to backtick template literal.

---

## MEDIUM — Should Address

### Type Safety

#### 18. Pervasive `as any` Casts
| Location | What |
|----------|------|
| `App.tsx:132,137` | `(pool as any).members_count` |
| `PoolDetailView.tsx:40` | `useState<any>(null)` for pool |
| `PoolCarousel.tsx:73` | `(pool as any).contribution_amount` |
| `CreatePoolWizard.tsx:22` | `useState<any>(null)` for pool |
| `WealthInsights.tsx:328,335` | `(user as any)?.savings_goal` |
| 4 components | `(window as any).confetti` |
| `services/friends.ts:284,291` | FK join result access |
| `services/insights.ts:159` | Joined ticket data |

- **Root cause:** `Pool` type missing `contribution_amount`, `game_type`, `invite_code`, `captain_id`, `total_collected`, `members_count`. `User` type missing `savings_goal`, `display_name`.
- **Fix:** Update `types/database.ts` with missing fields. Add `global.d.ts` for `window.confetti`.

### Data & Logic Bugs

#### 19. Hardcoded Pool IDs
- **File:** `components/TheBoard.tsx:195,206`
- **Issue:** Game cards pass `'1'` and `'2'` as pool IDs. Will break with real data.

#### 20. Hardcoded Profile Stats
- **File:** `components/ProfileView.tsx:95-118`
- **Issue:** "5 Active Pools", "$142.50 Won", "35%" progress, "Pro Member", "Syndicate Leader" are all static strings not connected to real data.

#### 21. Hardcoded Progress Bar
- **File:** `components/PoolCarousel.tsx:55`
- **Issue:** Progress bar always shows `w-[65%]` for every pool.

#### 22. Static "Good Morning" Greeting
- **File:** `components/DashboardHeader.tsx:42`
- **Issue:** Always says "Good Morning" regardless of time of day.

#### 23. `createPool` Partial Failure
- **File:** `services/pools.ts:108`
- **Issue:** If pool creation succeeds but adding captain as member fails, pool exists with 0 members. No rollback.

#### 24. `validateTicketNumbers` Skips Duplicate Check
- **File:** `services/tickets.ts:168`
- **Issue:** `hasDuplicates()` function exists but is never called. `[1,1,1,1,1]` passes validation.

#### 25. Jackpot Wins Recorded as $0
- **File:** `services/lottery.ts:325`
- **Issue:** Jackpot prize stored as `prize_amount: 0` even though the actual amount is available.

#### 26. `formatJackpot(0)` Returns "TBD"
- **File:** `services/lottery.ts:127`
- **Issue:** Uses `if (!amount)` — falsy check treats `0` as undefined.

#### 27. Month Label Year Collision
- **File:** `services/insights.ts:43`
- **Issue:** Chart uses year-less month labels. Jan 2025 and Jan 2026 merge into same bucket.

### Performance

#### 28. N+1 Queries
- `services/insights.ts:125` — ticket counts per pool in sequential loop
- `services/pools.ts:50` — member counts per pool in parallel loop (still N queries)
- **Fix:** Use single aggregated queries or database views.

#### 29. Sequential Independent Queries
- `services/lottery.ts:80` — Powerball + Mega Millions fetched sequentially
- `components/admin/AdminDashboard.tsx:69` — 3 dashboard queries sequential
- **Fix:** Wrap in `Promise.all()`.

#### 30. No Code Splitting
- **File:** `components/landing/LandingPage.tsx`
- **Issue:** All landing sub-pages (Terms, Privacy, About, Contact) eagerly imported. Single 500KB+ bundle.
- **Fix:** Use `React.lazy()` + `Suspense` for sub-pages.

#### 31. `useAuth` Double-Fetch on Mount
- **File:** `hooks/useAuth.ts`
- **Issue:** Both `initAuth()` and `onAuthStateChange` fire on mount, fetching user profile twice.
- **Fix:** Rely solely on `onAuthStateChange` (which fires `INITIAL_SESSION`).

#### 32. OCR Worker Race Condition
- **File:** `lib/ocrWorker.ts`
- **Issue:** Concurrent calls to `getOcrWorker()` can create duplicate workers, leaking memory.
- **Fix:** Store the creation promise instead of the instance.

### Non-Functional UI Elements

#### 33. Dead Buttons
| Button | File |
|--------|------|
| "Invite" button | `components/FriendsView.tsx:141` |
| "High Five" button | `components/FriendsView.tsx:388` |
| 4 Quick Action buttons | `components/admin/AdminDashboard.tsx:275` |
| Admin notification bell | `components/admin/AdminLayout.tsx:311` |

### Hooks

#### 34. `useInsights` Clears Data on Error
- **File:** `hooks/useInsights.ts:20`
- **Issue:** `setInsights(data)` runs unconditionally — clears previous insights when refetch fails.
- **Fix:** Gate behind `else` block so stale data is preserved on error.

#### 35. `useAdminTheme` Not Shared Across Components
- **File:** `hooks/useAdminTheme.ts`
- **Issue:** Each consumer gets independent state. Theme toggle in one component doesn't update another.
- **Fix:** Move to Zustand or React context if multiple consumers exist.

---

## LOW — Nice to Have

### Accessibility (Pervasive)

- [ ] **Clickable divs everywhere** — Replace `<div onClick>` with `<button>` or add `role="button"` + `tabIndex` + keyboard handler across all interactive elements
- [ ] **BottomNav has no text labels** — Only icons, no `aria-label`. Screen readers announce empty buttons
- [ ] **Missing Insights tab in BottomNav** — Mobile users can't access Insights
- [ ] **No focus trapping in modals** — All modals/panels lack focus management
- [ ] **Notification remove button is hover-only** — `opacity-0 group-hover:opacity-100` is untappable on mobile
- [ ] **Progress bars missing ARIA attributes** — No `role="progressbar"`, `aria-valuenow`, etc.
- [ ] **Labels not associated with inputs** — AuthScreen labels use `<label>` without `htmlFor`
- [ ] **No `document.title` updates** — Landing page custom routing doesn't update browser title

### Admin Code Quality

- [ ] **Theme object duplicated ~10 times** — Identical `const t = {...}` in each admin component. Extract to shared utility.
- [ ] **Supabase errors silently discarded** — AdminDashboard, ApiTester, AdminNotifications show empty data on failure with no user feedback.
- [ ] **`StatCard` defined inside render body** — `AdminDashboard.tsx:107`. Creates new component identity every render.
- [ ] **Admin `activeSection` typed as `string`** — Should be a union type of valid section IDs.
- [ ] **Hardcoded dark-mode dividers** — `divide-zinc-800/50` in AdminNotifications and EmailLogs doesn't switch with theme.
- [ ] **No data refresh/polling** — Admin dashboard data fetched once on mount, never refreshed.
- [ ] **No unsaved changes warning** — EmailTemplates editor silently discards edits on navigation.
- [ ] **`copyToClipboard` has no visual feedback** — ApiTester and EmailTestSend.
- [ ] **`AdminUser` type defined locally** — Should import from shared `types/database.ts`.
- [ ] **4 placeholder admin sections** — API Health, Users, Logs, Settings show "coming soon".

### Services Code Quality

- [ ] **Auth user construction repeated 4 times** — `services/auth.ts`. Extract to `constructUserFromAuth()` helper.
- [ ] **`logActivity` mutates `details` parameter** — `services/pools.ts:20`. Should clone before modifying.
- [ ] **`getPoolMembers` returns `any[]`** — `services/pools.ts:225`. Add proper typing.
- [ ] **`createContribution` returns `any`** — `services/pools.ts:265`. Add proper typing.
- [ ] **No input validation on contribution amounts** — `services/pools.ts`. Accepts 0, negative, or absurdly large values.
- [ ] **`uploadTicketImage` has no file validation** — `services/tickets.ts:191`. No type or size check.
- [ ] **Fire-and-forget patterns swallow errors silently** — Activity logging, notification creation on friend requests, email sends.
- [ ] **Edge function catch blocks return HTTP 200** — Should return 500.

### Vite Config

- [ ] **`GEMINI_API_KEY` exposed via `define`** — `vite.config.ts:14`. Gets compiled into client bundle. Use `import.meta.env.VITE_*` instead.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 6 |
| High | 11 |
| Medium | 18 |
| Low | 25+ |

**Recommended order of attack:**
1. Edge function auth + CORS (Critical #1-3)
2. Fix logout (Critical #6)
3. Delete dead/duplicate files (High #8-10)
4. Unify type system (High #7, Medium #18)
5. Fix admin panel bugs (High #14-17)
6. Address security issues (High #11-13)
7. Fix data/logic bugs (Medium #19-27)
8. Performance improvements (Medium #28-32)
9. Accessibility pass (Low)
10. Admin polish (Low)
