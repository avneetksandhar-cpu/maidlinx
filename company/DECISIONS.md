# Decisions log

Format: date · decision · owner · rationale · status

## 2026-08-14 — Dual-geo supply ACTIVE (GTA + FL) — correct FL-only deferral

- **Decision:** **TORONTO_GTA** and **SOUTH_FLORIDA** recruitment are both **ACTIVE** as **separate** supply experiments (not FL-primary with GTA deferred). Track funnels independently; do not blend vanity totals. Free channels only (FB groups, Kijiji, DMs, referrals, partnerships, SEO/content, direct outreach). **NO_PAID_ADS_ASSUMED.** GTA organic FB = 0 (composer failures — retry/fix is valid; prefer founder approval / show-before-post). FL organic FB = 8 published. Constraint remains **SUPPLY** (`BOOKABLE_CLEANERS=0`, markets CLOSED, Stripe LIVE OFF) until a market reaches ≥2 bookable in one zone. Update Growth OS + backlog + weekly loop accordingly.
- **Owner:** Founder + Growth / Product / Ops
- **Rationale:** Corrected operating context — both geos should run parallel organic supply tests without waiting for FL depth first, while still forbidding blended metrics, paid ads, and premature market open.
- **Status:** Accepted

## 2026-08-14 — Growth Operating System + supply constraint (superseded geo posture)

- **Decision:** Encode founder operating model in `company/GROWTH_OPERATING_SYSTEM.md` + prioritized `company/GROWTH_BACKLOG.md`. Cursor/agents act as growth/product/ops/economics engine (five questions on every action; bottleneck-first). **Current verified constraint = SUPPLY** (`BOOKABLE_CLEANERS=0`, markets CLOSED, Stripe LIVE OFF). Organic recruitment first; **paid ads LATER** after organic proves app→bookable conversion. Demand work only after bookable ≥ 2 in one zone of a market. No invented metrics; no booking/Stripe LIVE enablement from this decision. *(Geo posture originally said FL-primary / GTA deferred — superseded same day by dual-geo ACTIVE decision above.)*
- **Owner:** Founder + Growth / Product
- **Rationale:** Highest leverage is bookable supply in one area per market, not marketing activity. Board must make the constraint and backlog explicit for all agents.
- **Status:** Accepted (geo posture superseded 2026-08-14 dual-ACTIVE)

## 2026-08-12 — Owner Command vCenter (extend foundation)

- **Decision:** Build zero-cost Owner Command vCenter inside existing `/owner` + `src/lib/owner/` extending `00029`/`00030` via migration `00031`. Real-data dashboard, editable $100K/$1M targets, deterministic opportunity engine (persist to `ai_recommendations`, no auto-send), customer NBA profiles, cleaner capacity, B2B CRM shell, exceptions inbox, activity timeline, founder interventions. No paid LLM, no second app, no Stripe LIVE, no autonomous campaigns. Deploy only after migrations + BOOK→PAY smoke (founder call; default ship to PR).
- **Owner:** Founder + Lead Engineer
- **Rationale:** Foundation landed; founder needs operable remote command center on real signals before Ops/Retention agents.
- **Status:** Accepted

## 2026-08-12 — AI OS Phase 0 audit → Foundation only

- **Decision:** Complete full architecture audit (`company/AI_OS_PHASE0_AUDIT.md`) before more agent work. Next implementation slice is **FOUNDATION only**: `business_events` emitter, extend AI audit family (`ai_recommendations` / `ai_decisions` / `ai_actions` / `ai_exceptions` atop `00029`), GREEN/YELLOW/RED enforcement hooks, AI feature flags + simulation mode, global + per-agent AI pause, harden `/owner` command center. Do **not** build Ops/Retention/B2B/Growth/CoS agents beyond placeholders, abandoned campaigns, autonomous dispatch, CEO chat LLM, or pricing autonomy. Autonomy ladder: simulation → recommend → approval → GREEN-only later. No RED autonomy. No Stripe LIVE. Extend existing `src/ai` + `src/lib/ai` + `/owner` — no new app, no customer-site redesign.
- **Owner:** Founder + Lead Engineer / systems
- **Rationale:** Revenue Director V0 already shipped thin scaffolding; audit shows fragmentation (events) and missing kill-switch/flags. Foundation must land before more directors to avoid parallel schemas and unsafe autonomy.
- **Status:** Accepted

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
