# MaidLinx Cleaner Platform V1 — Verified Cleaner Network

**Branch:** `cursor/cleaner-platform-v1` (from `cursor/live-location-and-booking-ux`)  
**Status:** Implemented in code + migration `00025_cleaner_platform_v1.sql`  
**Constraint:** Do not break customer BOOK → PAY → ASSIGN → COMPLETE. Dynamic pricing left alone.

## Pipeline

`APPLICANT → IDENTITY_PENDING → SCREENING → TRAINING → APPROVED → ACTIVE → TRUSTED / ELITE`

Tracked on `cleaners.platform_stage` (also exposed via `professionals` view).

## Gates (server-side, configurable)

Table: `cleaner_approval_gates`  
Enforced by `evaluateApprovalGates` / `requireCleanerCanTakeJobs` before:

- Cleaner self-accept / claim (`src/lib/pro/dashboard/jobs.ts`)
- Admin assign (`src/lib/matching/assignment.ts`)
- Matching eligibility when `platformGatesAllowed === false`

Required gates: identity, background, phone, email, agreements, training, assessment, admin approval, active status.

**Never** auto-pass identity/background because a provider is unavailable.

## Providers

| Capability | Status | Behavior until connected |
|------------|--------|---------------------------|
| Identity | **PENDING** | `identity_status = PENDING_PROVIDER`; admin review to clear → `verified` |
| Background | **PENDING** | `background_status = PENDING_PROVIDER`; admin review to clear → `clear` |

Env flags (optional): `IDENTITY_PROVIDER_CONNECTED=true`, `BACKGROUND_PROVIDER_CONNECTED=true`, or provider URL envs. No homemade ID/KYC image store in DB.

## Academy

Tables: `academy_modules`, `cleaner_training_progress`, `cleaner_assessment_attempts`  
UI: `/cleaner/training` · API: `/api/cleaner/training`  
Pass score: 75%.

## Trust

- Internal scores: `trust_score`, `reliability_score`, `serious_flag_count`
- Flags: `cleaner_trust_flags` — high/critical → `requires_admin_review` (**no auto-fire**)
- Customer card: `CustomerCleanerCard` — truthful **MaidLinx Verified** copy only; no private screening details

## Admin

- `/admin/cleaners` — existing approve/activate list
- `/admin/cleaners/trust` — Trust Center + platform audit (`cleaner_platform_audit_log`)
- API: `/api/admin/cleaners/trust`

## Cleaner UX (`/cleaner`)

| Path | Purpose |
|------|---------|
| `/cleaner` | Dashboard + gate status |
| `/cleaner/application` | Non-sensitive application |
| `/cleaner/verification` | Identity + screening + contact confirm |
| `/cleaner/training` | Academy + assessment |
| `/cleaner/performance` | Trust/reliability |
| `/cleaner/jobs` … | Existing job/earnings/schedule (aliased from pro) |

Role auth: middleware keeps `/cleaner` + `/api/cleaner` to `cleaner`/`admin` only.

## Security / RLS notes

- Audit log: admin SELECT only; inserts via service role
- Gates: authenticated SELECT; admin write
- Training progress: owner or admin
- Trust flags: admin write; owner SELECT
- Grandfathering: existing `APPROVED` active/verified cleaners get admin-cleared verification so ASSIGN does not break; `*_provider` stays null so customer copy does not claim vendor screening

### Founder privilege-escalation checklist

1. Customer blocked from `/api/cleaner/*`
2. Cleaner blocked from `/api/admin/cleaners/trust`
3. Cleaner cannot update another cleaner row (RLS)
4. Audit log not readable by cleaner
5. Gates table not writable by cleaner
6. No cross-cleaner trust flag inserts
7. Gates enforced before accept/assign
8. Admin role not grantable via `user_metadata`
9. Customer APIs omit private screening refs
10. No gov-ID image columns in application JSON / cleaners

See `src/lib/cleaners/privilege-escalation.test.ts`.

## Synthetic TEST cleaner

1. Apply migration `00025_cleaner_platform_v1.sql`
2. Sign up with `role=cleaner` metadata (or convert a test user)
3. Complete `/cleaner/application` → verification start → confirm email/phone → Academy → assessment
4. In Trust Center: Clear ID, Clear BG (human review), approve onboarding if needed, Activate
5. Confirm gates all Pass, then assign a paid test booking

## Customer messaging

- **MaidLinx Verified** when `maidlinx_verified` and gates passed
- If background provider not connected: explain Academy + ops approval; **do not** claim vendor “background checked”
- When provider connected + `clear`: may state screened through screening partner

## Out of scope (V1)

- Homemade government-ID capture in DB
- Fabricated background results
- Dynamic pricing / Pricing Engine changes
- Site redesign
