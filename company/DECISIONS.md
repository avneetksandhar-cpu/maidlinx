# Decisions log

Format: date · decision · owner · rationale · status

## 2026-08-11 — Phased MVP execution + env STOP

- **Decision:** Execute in phases (0 board → 1 BOOK/PAY → 2 ASSIGN/CLEAN/COMPLETE/REBOOK → 3+ post-MVP). Stop Phase 1 when `SUPABASE_SERVICE_ROLE_KEY` or Stripe TEST keys are EMPTY locally; human pastes into `.env.local` only.
- **Owner:** Principal / Product Architect
- **Rationale:** Cannot prove or safely mutate the critical path without server persist + sandbox pay; no secret printing; no scope expansion past gate.
- **Status:** Accepted

## 2026-08-11 — AI company workspace

- **Decision:** Operate MaidLinx via Cursor project rules, skills, and `.cursor/agents/` role subagents; company board under `company/`.
- **Owner:** Product / CEO (workspace setup)
- **Rationale:** Current Cursor-supported mechanisms; no app rewrite; CRITICAL MVP gate in `CURRENT_SPRINT.md`.
- **Status:** Accepted

## Template

```
## YYYY-MM-DD — short title
- Decision:
- Owner:
- Rationale:
- Status: Proposed | Accepted | Superseded
```
