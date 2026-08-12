# Decisions log

Format: date · decision · owner · rationale · status

## 2026-08-12 — AI Revenue Director V0 after Launch P0 clear

- **Decision:** Keep the existing MaidLinx production app. Add AI operations/revenue as modular server-side services (`src/ai/`, `src/lib/ai/`) with a protected `/owner` founder command center. **Revenue Director is the first agent** (then Ops → Retention → B2B Sales → Growth → Chief of Staff). Approve AI Revenue Director V0 as next **internal** platform work now that Launch Gate P0 = 0. Do **not** weaken booking/payment/webhook/consent/Sentry. Stripe LIVE remains disabled. Outbound messaging auto-send stays OFF (recommend-only). Never invent fake pipeline dollars as live truth — label estimates; show data gaps honestly.
- **Owner:** Product / CEO (+ Lead Engineer implement)
- **Rationale:** Founder directed money-brain first inside the same codebase; Launch Gate CRITICAL P0s are cleared for controlled TEST; real-money stays gated. Resolves “no scope expand until MVP” vs AI exec kickoff by scoping AI as internal platform after P0, not customer-path rewrite.
- **Status:** Accepted

## 2026-08-12 — Launch Gate: controlled TEST yes, real money no

- **Decision:** `READY FOR CONTROLLED TEST LAUNCH: YES`; `READY FOR REAL-MONEY LAUNCH: NO` until Stripe LIVE explicitly approved. Wallets TEST via Express Checkout only.
- **Owner:** QA + Security / Lead Engineer (evidence in `LAUNCH_GATE.md`)
- **Rationale:** Lifecycle + consent + Sentry proven on TEST; LIVE keys absent by design.
- **Status:** Accepted

## 2026-08-11 — Phased MVP execution + env STOP

- **Decision:** Execute in phases (0 board → 1 BOOK/PAY → 2 ASSIGN/CLEAN/COMPLETE/REBOOK → 3+ post-MVP). Stop Phase 1 when critical env EMPTY locally.
- **Owner:** Principal / Product Architect
- **Rationale:** Cannot prove critical path without persist + sandbox pay.
- **Status:** Superseded in part by Launch Gate P0 clear (2026-08-12); LIVE money stop remains.

## 2026-08-11 — AI company workspace

- **Decision:** Operate MaidLinx via Cursor project rules, skills, and company board under `company/`.
- **Owner:** Product / CEO
- **Rationale:** Coordination without app rewrite.
- **Status:** Accepted

## Template

```
## YYYY-MM-DD — short title
- Decision:
- Owner:
- Rationale:
- Status: Proposed | Accepted | Superseded
```
