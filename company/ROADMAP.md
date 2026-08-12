# MaidLinx roadmap (company board)

**Rule:** No secrets. Aligns with `LAUNCH_GATE.md`, `MVP.md`, `DECISIONS.md`.  
**Live money:** Stripe LIVE disabled until founder approval.

## Phase status (2026-08-12)

| Phase | Focus | Status |
|-------|--------|--------|
| Launch Gate P0 | Maps, Sentry, consent, TEST lifecycle, wallet TEST config | **CLEAR (0 P0)** |
| Controlled TEST | Operate on Stripe TEST | **YES** |
| Real-money launch | Stripe LIVE + founder approval | **NO / gated** |
| AI exec V0 | Internal `/owner` + Revenue Director | **Shipped (thin V0)** |
| AI OS Phase 0 | Full architecture audit | **COMPLETE** — `AI_OS_PHASE0_AUDIT.md` |
| AI OS Foundation | Events, audit tables, flags, pause, owner shell | **COMPLETE (local)** — see `AI_OS_FOUNDATION_REPORT.md` |

## Ranking goals

1. Customers book easily  
2. Customers come back  
3. Cleaners reliably fulfill jobs  
4. MaidLinx earns healthy margin → path to **$100K+/mo** sustainably  
5. Founder can operate remotely (AI command center)  
6. Commercial accounts create recurring revenue  

## Near-term execution order

| Rank | Item | Notes |
|------|------|-------|
| 1 | Protect booking/pay/webhook/consent/Sentry | Never regress |
| 2 | **AI OS Foundation** | Events + audit + flags + pause + `/owner` harden |
| 3 | AI Revenue Director V0 | **Shipped** — reuse; no duplicate |
| 4 | AI Ops Director V0 | After foundation stable; recommend-first |
| 5 | AI Retention Director V0 | Recommend-only messaging until gates clear |
| 6 | AI B2B Sales → Growth → Chief of Staff | Placeholders until prior agents earn trust |
| 7 | Merge split PR stack into `main` | P1 ops (HUMAN) |
| 8 | Stripe LIVE enablement | RED — founder only |

## AI permission model (all agents)

| Level | Meaning | Examples |
|-------|---------|----------|
| GREEN | Auto | Analytics, briefs, ranking, internal recommends |
| YELLOW | Within limits | Message drafts / limited ops prep |
| RED | Founder approve | Refunds, pricing, payouts/bank, contracts, legal, safety, campaigns |

Audit log all AI actions (`ai_audit_log`).

## Explicitly out (now)

- Building all 15 / all 6 directors fully  
- Auto customer campaigns / email blasts  
- Stripe LIVE / Connect LIVE wallet money  
- Invented metrics presented as live truth  
- Mega customer/pro/admin folder rewrite unless already aligned  

## Coordination

- Sprint: `company/CURRENT_SPRINT.md`  
- Launch evidence: `company/LAUNCH_GATE.md`  
- Decisions: `company/DECISIONS.md`  
- Reports: `company/AGENT_REPORTS/`  
