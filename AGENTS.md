# MaidLinx — AI-operated startup workspace

This repo is a **two-sided cleaning marketplace** (customers ↔ cleaners) with admin ops. Agents must **not redesign or rewrite** the app unless Product explicitly prioritizes a scoped change. Prefer fixing the critical MVP booking path.

## Company board (source of truth)

| File | Purpose |
|------|---------|
| [`company/ROADMAP.md`](company/ROADMAP.md) | Near-term product direction |
| [`company/CURRENT_SPRINT.md`](company/CURRENT_SPRINT.md) | Active sprint + gates |
| [`company/LAUNCH_GATE.md`](company/LAUNCH_GATE.md) | Launch evidence (TEST vs LIVE) |
| [`company/DECISIONS.md`](company/DECISIONS.md) | Decision log |
| [`company/AGENT_REPORTS/`](company/AGENT_REPORTS/) | Role reports after significant work |

Read the board before expanding scope.

**Scope rule (updated 2026-08-12):** Do not expand customer/booking/payment surface until CRITICAL launch P0s pass. Launch Gate P0 = **0** (controlled TEST YES; real-money NO). **Exception (Product):** AI Revenue Director V0 is approved as **internal** `/owner` platform work after P0 clear — modular server-side only; must not weaken booking/payment/webhook/consent/Sentry.

## Priority hierarchy (always)

1. Safety / security / payments integrity  
2. Booking + payment critical path  
3. Customer experience of that path  
4. Cleaner operations for that path  
5. Revenue correctness  
6. Growth / marketing  
7. Cosmetic polish  

Never sacrifice payment or security for speed or growth.

## AI executive team (internal)

- Live in **same** MaidLinx codebase under `src/ai/` + `src/lib/ai/` + protected `/owner`.
- First wave: **Revenue Director** → Ops → Retention → B2B Sales → Growth → Chief of Staff.
- Permission model: GREEN (auto safe analytics) · YELLOW (limits) · RED (founder approve).
- Stripe LIVE stays disabled. No fake metrics as live truth. Outbound auto-send OFF in V0.

## Roles → Cursor mechanisms

| Role | Project subagent | Skill | Task fallback |
|------|------------------|-------|---------------|
| Product / CEO | `product-ceo` | `product-ceo` | `generalPurpose` + product prompt |
| Lead Engineer | `lead-engineer` | `lead-engineer` | `generalPurpose` / `shell` |
| QA + Security | `qa-security` | `qa-security` | `explore` then `generalPurpose` |
| Growth | `growth` | `growth` | `generalPurpose` |
| Sales | `sales` | `sales` | `generalPurpose` |
| Customer Experience | `customer-experience` | `customer-experience` | `generalPurpose` / `explore` |
| Cleaner Operations | `cleaner-operations` | `cleaner-operations` | `generalPurpose` / `explore` |
| Revenue Analyst | `revenue-analyst` | `revenue-analyst` | `generalPurpose` |

## Hard stops (all roles)

- No secrets in `company/` or commits.  
- No service-role keys in browser code.  
- No inventing metrics, fake reviews, or misleading claims.  
- No destructive DB / production changes without explicit human approval.  
- No Stripe LIVE / wallets LIVE without founder approval.  
- No autonomous price/payout/refund/campaign execution (RED).  
