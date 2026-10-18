# MaidLinx AI OS — Phase 0 Architecture Audit

**Date:** 2026-08-12  
**Branch:** `split/o-launch-gate` (PR #16)  
**Auditor role:** Senior staff / systems / security / AI / product / data / DevOps  
**Mode:** Inspection only (Phase 0). No application code changes in this phase.  
**Master Build Brief source:** Founder CRITICAL instruction (this session) + company board + Revenue Director V0 ship.

---

## STATUS (Phase 0)

| Field | Value |
|-------|--------|
| STATUS | **COMPLETE** |
| VERDICT | Production marketplace is solid for controlled TEST. AI exec V0 is a thin additive layer — extend, do not duplicate or rewrite. Foundation gaps are clear and bounded. |
| P0 REGRESSIONS | None introduced by audit (docs-only). Proven P0 path must remain DO NOT TOUCH. |
| READY FOR FOUNDATION | **YES** — additive only under `src/ai/`, `src/lib/ai/`, `/owner`, migrations after `00029`. |
| READY FOR AUTONOMOUS AGENTS | **NO** — simulation → recommend → approval ladder first. No RED autonomy. |
| DEPLOYED | N/A (audit docs) |
| ROLLBACK | Delete this report / revert board edits if unwanted. |

---

## 1. Executive verdict

MaidLinx is a **Next.js 16 / React 19 App Router** two-sided cleaning marketplace on **Supabase Auth + Postgres + RLS**, with **Stripe PaymentIntents + Elements** (TEST-only by policy), **Resend/Twilio outbox notifications**, **Sentry**, and a proven **BOOK→PAY→OFFER→ASSIGN→COMPLETE** lifecycle (Launch Gate P0 = 0).

AI executive work already started as **Revenue Director V0** + protected `/owner` + migration `00029` (`ai_audit_log`, `ai_action_approvals`). That is the correct architectural direction: **modular server-side modules**, not a new app and not a customer-site redesign.

**Phase 0 conclusion:** Proceed to **FOUNDATION only** (events, audit extension, permissions enforcement hooks, feature flags, global/per-agent pause, owner shell hardening). Do **not** start Ops/Retention/Sales/Growth agents, abandoned campaigns, autonomous dispatch, CEO chat LLM, or pricing experiments.

---

## 2. Current architecture

### 2.1 Framework & stack

| Layer | Choice | Evidence |
|-------|--------|----------|
| Framework | Next.js `^16.2.12` (App Router, Turbopack dev `:3001`) | `package.json` |
| UI | React `^19.2.3`, Tailwind `^4.1.18` | `package.json` |
| Language | TypeScript `^5.9.3` | `package.json` |
| Auth / DB | Supabase SSR + JS clients; service role server-only | `src/lib/supabase/*` |
| Payments | Stripe `^20.1.0` + Elements / Express Checkout | `src/lib/stripe/*`, checkout route |
| Observability | `@sentry/nextjs` `^10.70.0` | `sentry.*.config.ts`, `instrumentation.ts` |
| Validation | Zod | Widespread |
| Tests | Vitest `^3.2.4` (~55 unit tests); **no Playwright/CI workflows** | `vitest.config.ts` |
| Deploy | Vercel (`vercel.json`); no root crons | `vercel.json` |

Nested `wingman/` is a separate app — out of AI OS scope.

### 2.2 App Router shape (do not force rewrite)

| Group | Role |
|-------|------|
| `(marketing)/` | Public site + booking wizard |
| `(auth)/` | Sign-in / sign-up |
| `(platform)/dashboard` | Customer |
| `(platform)/cleaner` (+ `/pro` redirect) | Cleaner portal |
| `(platform)/admin` | Ops admin |
| `(platform)/owner` | AI founder command center (V0) |
| `api/` | Route handlers (bookings, cleaner, admin, webhooks, analytics) |

**Recommendation:** Keep this structure. Additive modules under `src/ai/`, `src/lib/ai/`, `/owner` — **DO NOT** mega-rewrite into `/app/customer` etc.

### 2.3 Database

Migrations through `00029_ai_exec_foundation.sql`. Core domains:

- Bookings / payments / deposits  
- Cleaner platform + Connect stubs  
- Match offers / dispatch config / fraud flags  
- Funnel + retention + brain intelligence tables  
- Notification outbox + Stripe webhook idempotency  
- Admin audit / permissions  
- AI audit + approval scaffold (`00029`)

**Types lag:** `database.types.ts` missing some `brain_*` / newer tables; code uses soft-fail / `as never` in places.

### 2.4 Auth & RLS

- Supabase Auth (Clerk webhook → 410 legacy).  
- Middleware refreshes session; protects `/dashboard`, `/cleaner`, `/admin`, `/owner`, related APIs.  
- Roles: `customer` | `cleaner` | `admin` (`src/lib/auth/roles.ts`).  
- Admin bootstrap via `ADMIN_BOOTSTRAP_EMAIL` — not client metadata.  
- AI tables: RLS enabled, **no client policies** (service-role only) — correct for V0.  
- Owner gate: admin session + `analytics.read` | `revenue.read`.

### 2.5 Stripe architecture

| Concern | Implementation |
|---------|----------------|
| Checkout model | **PaymentIntent + Payment Element + Express Checkout Element** (not hosted Checkout Sessions) |
| Consent | Server-enforced before PI create (`LEGAL_CONSENT_REQUIRED`) |
| Confirm | Webhook primary + client confirm-payment fallback |
| Idempotency | `stripe_webhook_events` claim + PI reuse |
| Deposit | Default ~25% (`lib/payments/deposit.ts`) |
| Connect | Stub unless `STRIPE_CONNECT_ENABLED` + TEST |
| LIVE | **Disabled by policy** — no `sk_live_` / `pk_live_` |

### 2.6 Booking lifecycle (PROVEN P0)

```
pending_payment → (consent + PI pay) → confirmed → awaiting_assignment
  → offer → accept/assign → on_the_way → arrived → in_progress → completed
```

Key files: `lib/bookings/{status,repository,events}.ts`, checkout/confirm-payment routes, Stripe webhook, matching `assignment.ts`, cleaner job transitions.

### 2.7 Cleaner / matching / dispatch

- Match Engine V1 under `src/lib/matching/` (score, rank, offer, accept, admin assign).  
- Admin queues: `lib/admin/queues.ts` + `/api/admin/queues`.  
- `src/lib/dispatch/` is docs-only; live logic in matching + queues.  
- Auto-matching / autonomous dispatch: **not live** (correct for now).

### 2.8 Notifications

- Resend email + Twilio SMS via `lib/notifications/*` + `notification_outbox`.  
- Eager process after enqueue; **no scheduled worker / Vercel cron**.  
- Retention schedule offsets documented; no campaign runner.

### 2.9 Admin & analytics

- Rich `/admin/*` (bookings, payments, payouts, pricing, analytics, queues, …).  
- Funnel events: `funnel_events` + `/api/analytics/funnel`.  
- Owner `/owner` is separate AI surface (not a replacement for admin).

### 2.10 Sentry & deployment

- Sentry wired server/edge/client; `sendDefaultPii: false`; tunnel `/monitoring`.  
- Production Launch Gate: Sentry PASS, consent PASS, TEST lifecycle PASS.  
- Real-money launch: **NO**.  
- No GitHub Actions CI in repo.

### 2.11 Background jobs

| Mechanism | Status |
|-----------|--------|
| Vercel Cron | None |
| Supabase Edge Functions | None in repo |
| Outbox | Eager inline process |
| Retention / AI agents | No runners |

---

## 3. Existing AI-related functionality

### 3.1 What exists (ship on tip `096620d`)

| Piece | Path | Notes |
|-------|------|-------|
| AI lib | `src/lib/ai/{types,permissions,audit,session,agents}.ts` | Foundation kernels |
| Revenue Director V0 | `src/ai/revenue-director/opportunities.ts` | Real-data hunts; honest gaps |
| Owner UI | `(platform)/owner/*`, `components/owner/owner-nav.tsx` | Admin-gated |
| Migration | `00029_ai_exec_foundation.sql` | `ai_audit_log`, `ai_action_approvals` |
| Brain (adjacent) | `src/lib/brain/*` + `00027` | Marketplace intelligence — not LLM exec |
| Outbound auto-send | Const `false` | Correct |

### 3.2 What is stub / thin

- `ai_action_approvals` — table only; no TS queue helpers / UI.  
- Permission helpers (`canAutoExecute`, `requiresFounderApproval`) — classify; **not enforced** as execution gateway.  
- Agents 2–6 — UI placeholders only.  
- `listAiAuditLog` — unused in UI.  
- Opportunities — ephemeral in brief; not persisted as recommendations.  
- Tests — ranking unit tests only.

### 3.3 Event fragmentation (pre-foundation)

| Bus | Table | Owner |
|-----|-------|-------|
| Booking lifecycle | `booking_events` | Bookings |
| Funnel | `funnel_events` | Pricing / analytics |
| Retention | `retention_events` | Retention |
| Brain | `brain_events` | Brain |
| **business_events** | — | **MISSING** |

Foundation should add a **cross-domain business event bus** that *mirrors* critical booking/payment signals without replacing `booking_events` (preserve P0 path).

---

## 4. Existing automation, tests, security controls

### Automation
No AI autonomy runners. No campaign auto-send. Match batch stub. Connect LIVE off.

### Tests (relevant)
Vitest coverage strong on bookings status/access/consent, matching, webhook idempotency, admin permissions, pricing. AI: `opportunities.test.ts` only.

### Security controls (preserve)
- RLS + service-role separation  
- Middleware role gates  
- Stripe signature verify + webhook claim  
- Checkout legal consent  
- Sentry PII scrubbing  
- Soft-fail patterns for optional intelligence tables (must not break checkout)  
- Secrets never in `company/` or commits  

---

## 5. Tables / API routes / jobs (inventory highlights)

### AI / intelligence tables
`ai_audit_log`, `ai_action_approvals`, `brain_*`, `funnel_events`, `retention_events`, `dispatch_exceptions`, `fraud_review_flags`, `admin_audit_log`, `booking_events`, `stripe_webhook_events`, `notification_outbox`.

### Critical API routes (DO NOT TOUCH behavior)
- `POST /api/bookings/[id]/checkout`  
- `POST /api/bookings/[id]/confirm-payment`  
- `POST /api/webhooks/stripe`  
- Booking create/quote  
- Cleaner offer accept / job transitions  

### Jobs
None scheduled. Foundation must not introduce blocking cron on the booking path.

---

## 6. Master Build Brief — component classification

Legend: **EXISTING** | **PARTIAL** | **MISSING** | **DO NOT TOUCH** | **RECOMMENDED**

| Component | Classification | Notes |
|-----------|----------------|-------|
| Production marketplace app | **EXISTING** / **DO NOT TOUCH** (rewrite) | Keep; extend modularly |
| Booking / payment lifecycle | **EXISTING** / **DO NOT TOUCH** | Launch Gate proven |
| Stripe webhooks + idempotency | **EXISTING** / **DO NOT TOUCH** | Soft emit only if wiring events |
| Checkout legal consent | **EXISTING** / **DO NOT TOUCH** | |
| Sentry | **EXISTING** / **DO NOT TOUCH** | |
| Resend / notification outbox | **EXISTING** / **DO NOT TOUCH** (behavior) | May later *recommend* via Retention — not now |
| Auth / RLS / admin roles | **EXISTING** / **DO NOT TOUCH** | Owner reuses admin |
| Match Engine / offers | **EXISTING** / **DO NOT TOUCH** (auto-dispatch) | Manual/admin path stays |
| Stripe LIVE / Connect LIVE | **DO NOT TOUCH** (disabled) | Founder-only enablement |
| `/owner` command center | **PARTIAL** | Shell + Revenue brief; needs pause/flags/audit UI |
| Revenue Director V0 | **EXISTING** (V0) | Rank/recommend only; reuse |
| AI permissions GREEN/YELLOW/RED | **PARTIAL** | Matrix exists; enforce + pause next |
| `ai_audit_log` | **EXISTING** | Extend metadata/usages; keep table |
| `ai_action_approvals` | **PARTIAL** (DB stub) | Wire helpers later; no auto-exec |
| `ai_actions` / `ai_decisions` / `ai_recommendations` / `ai_exceptions` | **MISSING** | Prefer extend `00029` family via new migration |
| `business_events` + emitter | **MISSING** | Foundation #1; mirror critical signals |
| Feature flags (`AI_*`, simulation) | **MISSING** | Env+table preferred |
| Global AI pause + per-agent pause | **MISSING** | Owner-controlled |
| Ops / Retention / B2B / Growth / CoS agents | **PARTIAL** (placeholders) | **Do not build** this phase |
| Abandoned recovery campaigns | **MISSING** / **DO NOT** (now) | Recommend-only later |
| Autonomous dispatch | **MISSING** / **DO NOT** (now) | |
| B2B CRM full build | **MISSING** / **DO NOT** (now) | |
| CEO chat LLM | **MISSING** / **DO NOT** (now) | |
| Pricing experiments autonomous | **DO NOT** | RED |
| MaidLinx Brain | **EXISTING** (adjacent) | Reuse signals; not replace with AI OS |
| CI / e2e Playwright | **MISSING** | P1 ops; not foundation blocker |
| Types regen for brain/AI | **PARTIAL** | **RECOMMENDED** after foundation migration |

---

## 7. Technical debt

| Item | Severity | Note |
|------|----------|------|
| `database.types.ts` lag vs migrations | P1 | Soft-fails hide missing tables |
| No CI workflows | P1 | Regressions rely on local/manual |
| No Playwright e2e | P1 | Launch Gate was manual evidence |
| Event bus fragmentation | P1 (AI OS) | Foundation addresses via `business_events` |
| Approval queue unwired | P1 (AI OS) | Scaffold only |
| Nested `wingman/` | P2 | Confusion risk; out of scope |
| Clerk remnants (410, image host) | P2 | Harmless if left |
| Retention / outbox without cron | P2 | Eager process may miss retries |

---

## 8. Risks

### P0 risks (must not worsen)

1. Breaking checkout consent → PI → webhook → `confirmBookingPayment`.  
2. Weakening Stripe signature / idempotency.  
3. Introducing service-role keys to client bundles.  
4. Enabling Stripe LIVE or auto refunds/payouts/campaigns.  
5. Blocking booking path on AI/event write failures.

### P1 risks

1. Parallel conflicting AI schemas (avoid — extend `00029` lineage).  
2. Fake pipeline metrics presented as live truth.  
3. Permission matrix display-only → false sense of safety.  
4. Migration `00029` not applied on remote → silent audit soft-fail.  
5. Split PR stack unmerged to `main` (ops debt).

---

## 9. Proposed implementation map (Foundation → later)

### Foundation (THIS sprint after Phase 0) — additive

```
00030_ai_os_foundation.sql
  ├── business_events (+ unique idempotency key)
  ├── ai_recommendations, ai_decisions, ai_actions, ai_exceptions
  ├── ai_feature_flags (+ seed AI_* / pause / simulation)
  └── extend comments / indexes on ai_audit_log (no breaking change)

src/lib/events/business-events.ts     — emitBusinessEvent (soft-fail, idempotent)
src/lib/ai/flags.ts                   — get/set flags (DB + env fallback)
src/lib/ai/pause.ts                   — global + per-agent pause
src/lib/ai/permissions.ts             — assertCanRun / simulation gate
src/lib/ai/recommendations.ts etc.    — persistence helpers (no auto-exec)
Wire emits (non-blocking) at:
  booking created, payment succeeded, offer accepted (minimal set)
/owner hardening:
  pause toggles, flag status, recent audit, honest revenue/target placeholders
Tests: events idempotency, permissions+pause, flags, audit helpers
```

### Explicitly deferred

- Ops/Retention/B2B/Growth/CoS agent logic  
- Autonomous outbound / abandoned campaigns  
- Autonomous dispatch  
- CEO chat LLM  
- RED money actions  

### Autonomy ladder (policy)

`simulation → recommend → approval → GREEN-only later`  
**No RED autonomy. No autonomous outbound campaigns.**

---

## 10. Phase report — Phase 0

| Field | Value |
|-------|--------|
| STATUS | COMPLETE |
| FILES | `company/AI_OS_PHASE0_AUDIT.md` (+ board updates) |
| MIGRATIONS | None (Phase 0) |
| ROUTES | Inspected; none changed |
| SERVICES | Inspected `src/ai`, `src/lib/ai`, bookings, stripe, matching, brain, notifications |
| TESTS | Not run as gate for docs-only; foundation will require lint/typecheck/test |
| SECURITY | Confirmed: AI tables deny-all RLS; owner admin-gated; LIVE off; no secrets in board |
| REUSED | Revenue Director V0, `00029`, `/owner`, admin session, brain/funnel/booking events |
| NEW | This audit + board decision to run Foundation next |
| FLAGS | None yet (MISSING → Foundation) |
| AI PERMISSIONS | Matrix PARTIAL; enforcement Foundation |
| P0 REGRESSIONS | None (docs) |
| E2E | N/A |
| DEPLOYED | No |
| ROLLBACK | Revert docs |
| NEXT | **FOUNDATION** per section 9 |

---

## 11. HUMAN_ACTION_REQUIRED (carry forward)

1. Keep Stripe LIVE disabled.  
2. Apply `00029` (and upcoming foundation migration) on Supabase when ready.  
3. Review `/owner` as admin after foundation ship.  
4. Optional: merge split PR stack `#2–#16` into `main`.  
5. Production deploy of foundation: only if green locally; founder may leave deploy pending.

---

## 12. NEXT RECOMMENDED PHASE

**FOUNDATION** (events → audit tables → permissions/flags/pause → owner shell).  
Then **Ops Director V0 (recommend-only)** — only after foundation is stable and audited.
