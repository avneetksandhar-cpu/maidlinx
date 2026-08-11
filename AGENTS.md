# MaidLinx — AI-operated startup workspace

This repo is a **two-sided cleaning marketplace** (customers ↔ cleaners) with admin ops. Agents must **not redesign or rewrite** the app unless Product explicitly prioritizes a scoped change. Prefer fixing the critical MVP booking path.

## Company board (source of truth)

| File | Purpose |
|------|---------|
| [`company/ROADMAP.md`](company/ROADMAP.md) | Near-term product direction |
| [`company/CURRENT_SPRINT.md`](company/CURRENT_SPRINT.md) | Active sprint + CRITICAL MVP checklist |
| [`company/METRICS.md`](company/METRICS.md) | Funnel / ops metrics placeholders (no secrets) |
| [`company/DECISIONS.md`](company/DECISIONS.md) | Decision log |
| [`company/AGENT_REPORTS/`](company/AGENT_REPORTS/) | Role reports after significant work |

Read the board before expanding scope. **No scope expansion until CRITICAL MVP passes.**

## Priority hierarchy (always)

1. Safety / security / payments integrity  
2. Booking + payment critical path  
3. Customer experience of that path  
4. Cleaner operations for that path  
5. Revenue correctness  
6. Growth / marketing  
7. Cosmetic polish  

Never sacrifice payment or security for speed or growth.

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

- **Subagents:** `.cursor/agents/*.md` (Cursor project custom subagents).  
- **Skills:** `.cursor/skills/<name>/SKILL.md` — invoke by name / role request.  
- **Rules:** `.cursor/rules/*.mdc` — always-on company + coordination.  
- **Built-in Task types only:** `generalPurpose`, `explore`, `shell`, `best-of-n-runner`, etc. Do **not** invent fictional `subagent_type` enums.

## How to invoke a role

1. **By name:** “Ask Product / CEO to prioritize…” / “Use the Lead Engineer subagent to…”  
2. **Skill:** “Follow the `lead-engineer` skill” (loads mission + board pointers).  
3. **Task tool:** Launch `generalPurpose` / `explore` / `shell` with the role’s system prompt pasted from `.cursor/agents/<role>.md`.  
4. **Parallel coding:** Use **best-of-n-runner** or isolated **git worktrees** / cloud agents so agents do not edit the same files. Lead Engineer owns integration merges.

## Coordination (non-negotiable)

- One owner per file set; no multi-agent simultaneous edits to the same files.  
- Growth / Sales / Ops / CX / Revenue produce **briefs** for Lead Engineer when work needs critical infra.  
- QA reviews before major releases; Product prioritizes; Lead Engineer integrates.  
- Sibling agents may touch Supabase / env — **do not fight `.env.local`**; never commit secrets.

## Hard stops (all roles)

- No secrets in `company/` or commits (`.env.local`, service role, Stripe secrets, cards).  
- No service-role keys in browser code.  
- No inventing metrics, fake reviews, or misleading claims.  
- No destructive DB / production changes without explicit human approval.  
- No unsolicited real prospect outreach (Sales).  
- No autonomous price/payout changes (Revenue recommends only).

## Stack orientation (do not rewrite)

Next.js App Router, TypeScript, Supabase (Auth/RLS/Storage), Stripe Checkout + webhooks, Tailwind. See `README.md`, `MVP.md`, `SETUP_TODAY.md`, `docs/MARKETPLACE_ROADMAP.md`.
