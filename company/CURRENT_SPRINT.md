# Current sprint

**Branch:** `split/o-launch-gate` (PR #16)  
**Date:** 2026-08-12  
**Mode:** Post–Launch Gate P0 clear · AI executive foundation (Revenue Director V0)

## Gates

| Gate | Status | Note |
|------|--------|------|
| Launch Gate P0 | **0 remaining** | See `company/LAUNCH_GATE.md` |
| READY FOR CONTROLLED TEST LAUNCH | **YES** | Stripe TEST lifecycle proven |
| READY FOR REAL-MONEY LAUNCH | **NO** | Stripe LIVE disabled — hard rule |
| AI Revenue Director V0 | **IN PROGRESS → ship this session** | Internal `/owner` only |

## Product conflict resolution

Older board said “no scope expansion until CRITICAL MVP passes.” Launch P0s are clear. Product decision (**Accepted** in `DECISIONS.md`): AI Revenue Director V0 is approved as **next internal platform work** without weakening booking/payment/webhook/consent/Sentry. LIVE money stays **NO**.

## This sprint — in / out

**In**
- Modular `src/ai/` + `src/lib/ai/` scaffolding
- Permissions (GREEN/YELLOW/RED) + `ai_audit_log` migration
- Protected `/owner` command center (admin/founder only)
- Revenue Director V0 ranked opportunities from real data (honest gaps)
- Board updates + agent report

**Out**
- Full Ops / Retention / B2B / Growth / Chief of Staff agents
- Stripe LIVE, Connect LIVE, wallet LIVE
- Auto customer emails/campaigns (recommend-only)
- Mega route rewrite into customer/pro/admin folders

## Owners

| Area | Role |
|------|------|
| Priority / scope | Product / CEO |
| Implementation | Lead Engineer |
| Launch evidence | QA + Security (prior) |

## Next after this ship

1. Apply migration `00029_ai_exec_foundation` on Supabase (HUMAN if not applied).  
2. Build **Ops Director** V0 (second wave).  
3. Keep Stripe LIVE off until explicit founder approval.  
