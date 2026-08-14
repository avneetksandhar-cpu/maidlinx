# Current sprint

**Branch:** `split/o-launch-gate` (PR #16)  
**Date:** 2026-08-14  
**Mode:** Marketplace launch re-audit (NOT Content Studio) · Stripe TEST lifecycle re-proven · coverage RED · **Growth OS active**

## Growth OS (standing)

- Operating system: [`GROWTH_OPERATING_SYSTEM.md`](GROWTH_OPERATING_SYSTEM.md)  
- Prioritized backlog: [`GROWTH_BACKLOG.md`](GROWTH_BACKLOG.md)  
- **CURRENT_CONSTRAINT:** SUPPLY — `BOOKABLE_CLEANERS=0` · markets CLOSED · Stripe LIVE OFF  
- **Geo:** SOUTH_FLORIDA = primary experiment · TORONTO_GTA = separate, deferred second  
- Agents optimize measurable outcomes (five questions), not activity. Paid ads LATER after organic proves.

## Gates

| Gate | Status | Note |
|------|--------|------|
| Launch Gate P0 (code/payment) | **0 remaining** | Re-audit 2026-08-14 — see `LAUNCH_GATE.md` |
| Ops before open booking | **BOOKABLE=0** | Do not enable markets until coverage ready |
| READY FOR CONTROLLED TEST LAUNCH | **YES** | Fresh Stripe TEST lifecycle on booking `6f487969-…` |
| READY FOR REAL-MONEY LAUNCH | **NO** | Stripe LIVE disabled — hard rule |
| Production SHA | `ca3c88f` | Live `sentry=true` (apex + www) |
| Growth bottleneck | **SUPPLY (FL)** | 8 FL FB groups posted; GTA posts 0; target 10→5→3→2+ bookable |
| AI OS Phase 0 audit | **COMPLETE** | `company/AI_OS_PHASE0_AUDIT.md` |
| AI OS Foundation | **COMPLETE (local)** | `company/AI_OS_FOUNDATION_REPORT.md` |
| Owner Command vCenter | **COMPLETE (local)** | `company/AI_OS_OWNER_VCENTER_REPORT.md` |
| AI Revenue Director V0 | **SHIPPED + extended** | Opportunity engine expanded; persist recommends |
| Autonomous AI actions | **OFF** | Simulation → recommend → approval ladder |
| Foundation/vCenter prod deploy | **READY note — founder** | Apply `00029`–`00031` then smoke BOOK→PAY |

## This sprint — in / out

**In (done)**
- Phase 0 architecture audit
- Foundation: `business_events`, AI audit family, permissions gateway, flags, pause
- Owner Command vCenter: real metrics, $100K/$1M trackers, opportunities, CRM, exceptions, capacity, activity, interventions
- Growth OS + backlog encoded on company board
- Lint / typecheck / 295 tests / production build green

**Out (still)**
- Full Ops / Retention / Growth / Chief of Staff agent autonomy
- Abandoned recovery campaigns auto-send, autonomous dispatch, CEO chat LLM, pricing experiments
- Stripe LIVE, Connect LIVE, wallet LIVE
- Paid ads (blocked until organic FL proves)
- Mega route rewrite / new app

## Next

1. **HUMAN (Growth P0):** FL supply — drive apps at https://maidlinx.com/earn → screen → ops-complete → **2+ bookable same FL zone**. Kit: `company/growth/cleaner-recruiting/`. See `GROWTH_BACKLOG.md`.  
2. **HUMAN (Phase 1 STOP):** Enter REAL cleaner ops only for verified applicants / known market — do not invent market for `ba902d50-…`. Do not enable markets until coverage ready.  
3. **HUMAN:** Apply remaining local migrations as needed (`00029`–`00033`); smoke `/owner/cleaners` + BOOK→PAY only after a market’s booking flag is ON. Waitlist needs `00033_launch_waitlist`.  
4. Keep Stripe LIVE off until explicit founder approval. Demand work only after bookable ≥ 2.  
5. **Out today:** AI agents, pricing engine continuation, fabricated cleaners, paid ads, GTA spray.  
