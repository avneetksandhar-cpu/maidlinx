# MaidLinx roadmap (company board)

**Rule:** No secrets in this file. Product owns updates. Aligns with `MVP.md` and `docs/MARKETPLACE_ROADMAP.md` — does not replace them.

**Scope rule:** Roadmap items below are **docs / planning only** until CRITICAL MVP in `CURRENT_SPRINT.md` passes. Do **not** implement roadmap features or interrupt sibling work on **BOOK → PAY → ASSIGN → CLEAN → COMPLETE → REBOOK**.

## Ranking goals (in order)

1. Customers book easily  
2. Customers come back  
3. Cleaners reliably fulfill jobs  
4. MaidLinx earns healthy margin  
5. Founder can operate remotely  
6. Commercial accounts create recurring revenue  

Within a priority band (P0→P3), rank by **value ÷ complexity** (and risk). P0 = MVP gate only.

---

## Ranked master list

| Rank | Priority | Item | Recommended sprint |
|------|----------|------|--------------------|
| 1 | P0 | CRITICAL MVP — booking → pay → assign → clean → complete → rebook | Current sprint |
| 2 | P0 | Maps + location + service-area capture (MVP slice) | Current sprint |
| 3 | P0 | Supabase persistence + auth/RLS boundaries (MVP) | Current sprint |
| 4 | P0 | Stripe sandbox deposit + webhook confirmation (MVP) | Current sprint |
| 5 | P0 | Cleaner portal status lifecycle + admin assign (MVP) | Current sprint |
| 6 | P0 | Mobile-usable critical path + production build (MVP) | Current sprint |
| 7 | P1 | Booking cancellation / reschedule rules | Sprint after MVP |
| 8 | P1 | Refund / credit workflow | Sprint after MVP |
| 9 | P1 | Cleaner replacement workflow | Sprint after MVP |
| 10 | P1 | Harden notifications (email/SMS) | Sprint after MVP |
| 11 | P1 | Ops playbooks (no-show / reassign) | Sprint after MVP |
| 12 | P1 | Saved payment methods via Stripe | +1–2 sprints post-MVP |
| 13 | P1 | Verified completed-booking reviews | +1–2 sprints post-MVP |
| 14 | P1 | Cleaner recruiting funnel | +1–2 sprints post-MVP |
| 15 | P1 | Cleaner supply vs booking demand tracking | +1–2 sprints post-MVP |
| 16 | P1 | Operational exception alerts | +1–2 sprints post-MVP |
| 17 | P1 | CX microcopy + error-state clarity | Sprint after MVP (parallel docs/copy) |
| 18 | P1 | Marketplace V1 polish (explainable admin match) | Sprint after MVP |
| 19 | P1 | Invoices / receipts | +2 sprints post-MVP |
| 20 | P1 | Daily founder command center | +2 sprints post-MVP |
| 21 | P2 | Recurring bookings (consumer) | V2 |
| 22 | P2 | Customer loyalty / retention metrics | V2 metrics |
| 23 | P2 | Customer lifetime value tracking | V2 metrics |
| 24 | P2 | Contribution-margin reporting | V2 finance |
| 25 | P2 | Booking source attribution | V2 growth |
| 26 | P2 | Service-area pricing | V2 pricing |
| 27 | P2 | Customer support ticketing | V2 support |
| 28 | P2 | Cleaner issue reporting | V2 ops |
| 29 | P2 | Availability engine → real slot generation | V2 marketplace |
| 30 | P2 | Preferred cleaners / favorites UX | V2 marketplace |
| 31 | P3 | Customer referrals | Growth (gated) |
| 32 | P3 | Automated matching / auto-offer | Marketplace V2+ |
| 33 | P3 | Quote requests | Commercial |
| 34 | P3 | Commercial sales pipeline | Commercial |
| 35 | P3 | Recurring commercial contracts | Commercial |
| 36 | P3 | Gift cleaning | Growth / gift |
| 37 | P3 | Reliability composite, live ETA, demand, fraud gates | Marketplace V3 |
| 38 | P3 | Multi-job schedule optimizer / route optimization | Marketplace V4 |
| 39 | P3 | AI features as product surface | Explicitly out until gated |
| 40 | P3 | Visual redesign / brand rewrite | Explicitly out until gated |

---

## Now — CRITICAL MVP (gate) — P0

Full functional MVP before any scope expansion. Detail and status live in `CURRENT_SPRINT.md`.

- Customer booking path (address → service → schedule → pay → confirmation)
- Maps autocomplete + location handling
- Supabase persistence (bookings, auth, storage as required)
- Stripe sandbox deposit + webhook confirmation
- Cleaner portal status lifecycle
- Admin assign
- Mobile-usable critical path
- Security basics (no secret leakage, RLS/auth boundaries)
- Production build passes
- Core loop proof: **BOOK → PAY → ASSIGN → CLEAN → COMPLETE → REBOOK**

---

## Item cards (post-MVP + preserved next/later)

Each card: **WHY / REVENUE / OPS / COMPLEXITY / DEPENDENCIES / RISK / PRIORITY / SPRINT**.

### Booking cancellation / reschedule rules

- **WHY IT MATTERS:** Customers and cleaners need clear, fair rules when plans change; undefined policy creates disputes and broken fulfillment.
- **REVENUE IMPACT:** Protects deposit/revenue on late cancels; reduces unpaid idle cleaner time; enables trustworthy rebook.
- **OPERATIONAL IMPACT:** Standardizes admin decisions; cuts ad-hoc Slack/DM handling.
- **COMPLEXITY:** Medium (policy + status transitions + Stripe partial refunds/credits).
- **DEPENDENCIES:** Stable booking statuses; Stripe refund/credit path; cleaner assignment state.
- **RISK:** Wrong cutoffs erode trust or margin; race with assign/start.
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** Sprint after MVP

### Refund / credit workflow

- **WHY IT MATTERS:** Payments integrity — incomplete refunds destroy trust and create chargebacks.
- **REVENUE IMPACT:** Controls leakage; credits can retain customers cheaper than full refunds + churn.
- **OPERATIONAL IMPACT:** Gives admin a safe, auditable path instead of manual Stripe Dashboard edits.
- **COMPLEXITY:** Medium–high (Stripe refunds, ledger of credits, idempotency, RLS).
- **DEPENDENCIES:** Webhook-confirmed payments; booking status; admin auth.
- **RISK:** Double-refund, credit abuse, secret exposure if mishandled.
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** Sprint after MVP

### Cleaner replacement workflow

- **WHY IT MATTERS:** Jobs still get done when a cleaner cancels, no-shows, or is unfit — core to reliable fulfillment.
- **REVENUE IMPACT:** Saves revenue that would otherwise refund; protects repeat booking rate.
- **OPERATIONAL IMPACT:** Turns emergencies into a repeatable reassignment playbook.
- **COMPLEXITY:** Medium (reassign + notify + status continuity; may touch match engine).
- **DEPENDENCIES:** Admin assign / match; notifications; cancellation rules.
- **RISK:** Customer confusion if messaging lag; double-assign.
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** Sprint after MVP

### Harden notifications (email/SMS)

- **WHY IT MATTERS:** Book → pay → assign → clean only works if people know what happened next.
- **REVENUE IMPACT:** Fewer abandoned “did it work?” drop-offs; higher show-up and rebook.
- **OPERATIONAL IMPACT:** Less manual pinging by founder/admin.
- **COMPLEXITY:** Medium (provider reliability, templates, retries, prefs).
- **DEPENDENCIES:** Booking/payment/cleaner status events; provider keys (env, not board).
- **RISK:** Delivery failures; spam/compliance if over-messaged.
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** Sprint after MVP

### Ops playbooks (no-show / reassign)

- **WHY IT MATTERS:** Documents and checklists so remote ops stay consistent under stress.
- **REVENUE IMPACT:** Faster recovery → fewer refunds and bad reviews.
- **OPERATIONAL IMPACT:** Founder/admin can delegate; reduces tribal knowledge.
- **COMPLEXITY:** Low–medium (mostly process + light UI hooks).
- **DEPENDENCIES:** Replacement workflow; exception alerts; cancellation rules.
- **RISK:** Playbooks ignored if not tied to product alerts.
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** Sprint after MVP (docs can start earlier without code)

### Saved payment methods via Stripe

- **WHY IT MATTERS:** One-tap rebook — customers come back with less friction (goal #2).
- **REVENUE IMPACT:** Higher conversion on repeat checkout; lower abandoned pay.
- **OPERATIONAL IMPACT:** Fewer “payment failed / card expired” support loops.
- **COMPLEXITY:** Medium (Stripe Customer + SetupIntent / saved PM; PCI stays with Stripe).
- **DEPENDENCIES:** Auth’d customer accounts; working Checkout/webhook path.
- **RISK:** Storing anything card-like ourselves (must not); consent/UX clarity.
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** +1–2 sprints post-MVP

### Verified completed-booking reviews

- **WHY IT MATTERS:** Trust signal only from real completed jobs — quality loop for customers and cleaners.
- **REVENUE IMPACT:** Social proof lifts conversion; better cleaners get more work → retention.
- **OPERATIONAL IMPACT:** Surfaces underperformers for coaching/removal.
- **COMPLEXITY:** Medium (gate on `completed`, moderation, display rules).
- **DEPENDENCIES:** Completed status proof; customer auth; cleaner profiles.
- **RISK:** Fake/incentivized reviews if not gated; review bombing.
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** +1–2 sprints post-MVP

### Cleaner recruiting funnel

- **WHY IT MATTERS:** Without supply, assignment fails — fulfillment is the product (goal #3).
- **REVENUE IMPACT:** More bookable capacity → more completed jobs and GMV.
- **OPERATIONAL IMPACT:** Structured apply → vet → approve → first job; less founder chase.
- **COMPLEXITY:** Medium (landing, application, docs, approval queue — much exists in stub form).
- **DEPENDENCIES:** Cleaner portal; admin approve; background/doc policy (ops).
- **RISK:** Low-quality supply if vetting weak; onboarding drop-off.
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** +1–2 sprints post-MVP

### Cleaner supply vs booking demand tracking

- **WHY IT MATTERS:** Know where you are short staffed before customers feel it.
- **REVENUE IMPACT:** Prevents lost bookings from “no cleaners”; guides market focus.
- **OPERATIONAL IMPACT:** Hiring and zoning decisions become data-backed.
- **COMPLEXITY:** Medium (metrics definitions, market/zone joins, dashboards).
- **DEPENDENCIES:** Markets/zones; booking + cleaner availability data; METRICS board.
- **RISK:** Misleading ratios if statuses wrong; over-hiring wrong zones.
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** +1–2 sprints post-MVP

### Operational exception alerts

- **WHY IT MATTERS:** Founder can operate remotely (goal #5) — only wake for true exceptions.
- **REVENUE IMPACT:** Faster intervention saves jobs and refunds.
- **OPERATIONAL IMPACT:** Replaces constant dashboard babysitting.
- **COMPLEXITY:** Medium (rules engine for late assign, no-start, payment anomaly).
- **DEPENDENCIES:** Reliable status webhooks/events; notification channel; command center later.
- **RISK:** Alert fatigue; missed alerts if rules too narrow.
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** +1–2 sprints post-MVP

### CX microcopy + error-state clarity

- **WHY IT MATTERS:** Customers book easily (goal #1) when errors and next steps are obvious.
- **REVENUE IMPACT:** Recovers abandoned steps on the critical path.
- **OPERATIONAL IMPACT:** Fewer “what does this mean?” support messages.
- **COMPLEXITY:** Low (copy + small UX; no architecture change).
- **DEPENDENCIES:** Stable booking screens; real error codes from APIs.
- **RISK:** Scope creep into redesign (blocked).
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** Sprint after MVP (copy can draft anytime)

### Marketplace V1 polish (explainable admin match)

- **WHY IT MATTERS:** Admin assigns faster with confidence; no V2 auto-match yet.
- **REVENUE IMPACT:** Higher assign rate and better cleaner–job fit → fewer failures.
- **OPERATIONAL IMPACT:** Less guesswork; training new ops easier.
- **COMPLEXITY:** Low–medium (UX on existing match scores).
- **DEPENDENCIES:** Live match engine; admin assign path.
- **RISK:** Premature auto-match temptation.
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** Sprint after MVP

### Invoices / receipts

- **WHY IT MATTERS:** Trust, expense reporting, and commercial readiness; customers expect proof of payment.
- **REVENUE IMPACT:** Unblocks business customers; reduces payment disputes.
- **OPERATIONAL IMPACT:** Less manual PDF/email from founder.
- **COMPLEXITY:** Medium (Stripe receipt links vs own invoice PDF; tax fields later).
- **DEPENDENCIES:** Confirmed payments; customer email; booking line items.
- **RISK:** Incorrect amounts/tax claims; overbuilding invoicing ERP.
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** +2 sprints post-MVP

### Daily founder command center

- **WHY IT MATTERS:** One screen for today’s jobs, exceptions, cash, and supply gaps — remote ops (goal #5).
- **REVENUE IMPACT:** Indirect: faster decisions protect GMV and margin.
- **OPERATIONAL IMPACT:** Replaces tab-hopping across admin tools.
- **COMPLEXITY:** Medium–high (aggregation UI + alert feed).
- **DEPENDENCIES:** Exception alerts; supply/demand metrics; payment status views.
- **RISK:** Dashboard theater without action links; scope creep.
- **PRIORITY:** P1
- **RECOMMENDED SPRINT:** +2 sprints post-MVP

### Recurring bookings (consumer)

- **WHY IT MATTERS:** Habit and retention — customers come back automatically (goal #2).
- **REVENUE IMPACT:** Predictable GMV; higher LTV.
- **OPERATIONAL IMPACT:** Scheduling load smoother if cadence known; more assign pressure.
- **COMPLEXITY:** High (series, exceptions, payment cadence, cleaner continuity).
- **DEPENDENCIES:** Solid one-off loop; saved PM; cancel/reschedule rules.
- **RISK:** Failed recurring charges; over-promise availability.
- **PRIORITY:** P2
- **RECOMMENDED SPRINT:** V2

### Customer loyalty / retention metrics

- **WHY IT MATTERS:** Measure whether customers come back (goal #2) — guides product and ops.
- **REVENUE IMPACT:** Informs retention bets that lift LTV.
- **OPERATIONAL IMPACT:** Highlights churn windows for outreach/playbooks.
- **COMPLEXITY:** Low–medium (definitions + reporting; no fake numbers).
- **DEPENDENCIES:** Completed bookings; customer identity; METRICS.md discipline.
- **RISK:** Vanity metrics; inventing numbers (forbidden).
- **PRIORITY:** P2
- **RECOMMENDED SPRINT:** V2 metrics

### Customer lifetime value tracking

- **WHY IT MATTERS:** Prioritize high-value segments and channels with real economics.
- **REVENUE IMPACT:** Directs growth spend and retention effort to profitable customers.
- **OPERATIONAL IMPACT:** Clarifies who deserves concierge recovery when jobs fail.
- **COMPLEXITY:** Medium (cohort logic, contribution after refunds/credits).
- **DEPENDENCIES:** Payments + refunds; attribution; margin reporting.
- **RISK:** Mis-modeled LTV drives bad discounts.
- **PRIORITY:** P2
- **RECOMMENDED SPRINT:** V2 metrics

### Contribution-margin reporting

- **WHY IT MATTERS:** MaidLinx earns healthy margin (goal #4) — GMV alone is not profit.
- **REVENUE IMPACT:** Surfaces unprofitable services/zones/addons before scale.
- **OPERATIONAL IMPACT:** Pricing and cleaner payout decisions become evidence-based (recommend only).
- **COMPLEXITY:** Medium–high (cost model: payout, refunds, acquisition — no autonomous price changes).
- **DEPENDENCIES:** Accurate booking economics; payout fields; refunds/credits.
- **RISK:** Wrong cost assumptions; pressure to cut cleaner pay unsafely.
- **PRIORITY:** P2
- **RECOMMENDED SPRINT:** V2 finance

### Booking source attribution

- **WHY IT MATTERS:** Know which channels create bookable, paying customers.
- **REVENUE IMPACT:** Improves CAC efficiency; stops wasting spend.
- **OPERATIONAL IMPACT:** Growth experiments become measurable.
- **COMPLEXITY:** Medium (UTM/referral capture through pay; privacy-safe storage).
- **DEPENDENCIES:** Booking create path; analytics hooks; METRICS.
- **RISK:** Broken attribution → false ROI; PII over-collection.
- **PRIORITY:** P2
- **RECOMMENDED SPRINT:** V2 growth

### Service-area pricing

- **WHY IT MATTERS:** Price reflects travel/cost by zone so booking stays fair and margin-healthy.
- **REVENUE IMPACT:** Protects margin in expensive zones; can unlock under-served areas.
- **OPERATIONAL IMPACT:** Fewer “too far / not worth it” cleaner declines.
- **COMPLEXITY:** Medium (pricing rules + markets/zones; server authority must stay).
- **DEPENDENCIES:** Markets/zones config; `calculateBookingPrice` authority; supply/demand insight.
- **RISK:** Confusing customer quotes; zone edge disputes.
- **PRIORITY:** P2
- **RECOMMENDED SPRINT:** V2 pricing

### Customer support ticketing

- **WHY IT MATTERS:** Structured support replaces inbox chaos as volume grows.
- **REVENUE IMPACT:** Faster resolution → retention; fewer chargebacks.
- **OPERATIONAL IMPACT:** Trackable SLAs; handoff between roles.
- **COMPLEXITY:** Medium (build vs integrate helpdesk).
- **DEPENDENCIES:** Auth; booking deep links; refund/credit and replacement workflows.
- **RISK:** Building a full Zendesk clone too early.
- **PRIORITY:** P2
- **RECOMMENDED SPRINT:** V2 support

### Cleaner issue reporting

- **WHY IT MATTERS:** Cleaners flag unsafe access, scope creep, or customer issues — protects fulfillment quality.
- **REVENUE IMPACT:** Prevents walk-aways and incomplete jobs that trigger refunds.
- **OPERATIONAL IMPACT:** Creates an ops queue tied to bookings.
- **COMPLEXITY:** Medium (mobile-friendly report + admin triage).
- **DEPENDENCIES:** Cleaner portal job context; exception alerts; ticketing optional.
- **RISK:** Noise reports; retaliation dynamics — need clear policy.
- **PRIORITY:** P2
- **RECOMMENDED SPRINT:** V2 ops

### Availability engine → real slot generation

- **WHY IT MATTERS:** Customers only see times cleaners can actually fulfill — book easily + fulfill reliably.
- **REVENUE IMPACT:** Fewer cancels after overbooking; higher completed rate.
- **OPERATIONAL IMPACT:** Less manual schedule firefighting.
- **COMPLEXITY:** High (capacity, buffers, travel — see marketplace docs).
- **DEPENDENCIES:** Cleaner availability; duration estimates; match/assign.
- **RISK:** Empty calendars if supply thin; complex edge cases.
- **PRIORITY:** P2
- **RECOMMENDED SPRINT:** V2 marketplace

### Preferred cleaners / favorites UX

- **WHY IT MATTERS:** Repeat customers want continuity; soft boost already exists in match.
- **REVENUE IMPACT:** Higher rebook and satisfaction.
- **OPERATIONAL IMPACT:** Dispatch respects favorites when eligible.
- **COMPLEXITY:** Low–medium (UX + preference storage).
- **DEPENDENCIES:** Completed history; match engine soft boost.
- **RISK:** Favorites unavailable → disappointment if messaging weak.
- **PRIORITY:** P2
- **RECOMMENDED SPRINT:** V2 marketplace

### Customer referrals

- **WHY IT MATTERS:** Low-CAC acquisition when product delight exists — not before MVP works.
- **REVENUE IMPACT:** Efficient growth if reward economics hold.
- **OPERATIONAL IMPACT:** Fraud/abuse monitoring; credit issuance.
- **COMPLEXITY:** Medium (codes, rewards, attribution, abuse).
- **DEPENDENCIES:** Credits; attribution; proven retention.
- **RISK:** Self-referral fraud; margin destruction via over-reward.
- **PRIORITY:** P3
- **RECOMMENDED SPRINT:** Growth (gated — after MVP + retention basics)

### Automated matching / auto-offer

- **WHY IT MATTERS:** Scale assign without founder in the loop — still after manual V1 is trusted.
- **REVENUE IMPACT:** Faster time-to-assign → fewer cancels.
- **OPERATIONAL IMPACT:** Ops shifts to exception handling.
- **COMPLEXITY:** High (auto-offer, accept/decline, fallbacks).
- **DEPENDENCIES:** Explainable V1 match; notifications; replacement workflow.
- **RISK:** Bad autos → customer/cleaner harm; hard to unwind trust.
- **PRIORITY:** P3
- **RECOMMENDED SPRINT:** Marketplace V2+

### Quote requests

- **WHY IT MATTERS:** Commercial / non-standard jobs need human quotes before commit (goal #6, later).
- **REVENUE IMPACT:** Pipeline for higher AOV jobs; not consumer MVP.
- **OPERATIONAL IMPACT:** Sales/ops workload; SLA on quote turnaround.
- **COMPLEXITY:** Medium (form → CRM/admin → convert to booking).
- **DEPENDENCIES:** Commercial pipeline; pricing discretion; invoices.
- **RISK:** Distracts from consumer critical path if built early.
- **PRIORITY:** P3
- **RECOMMENDED SPRINT:** Commercial

### Commercial sales pipeline

- **WHY IT MATTERS:** Track B2B/property-manager opportunities through close (goal #6).
- **REVENUE IMPACT:** Recurring multi-unit revenue potential — after consumer engine works.
- **OPERATIONAL IMPACT:** Sales process + handoff to ops scheduling.
- **COMPLEXITY:** Medium–high (CRM light vs integrate; stages; owners).
- **DEPENDENCIES:** Quote requests; contracts; capacity planning.
- **RISK:** Premature sales motion without fulfillment capacity.
- **PRIORITY:** P3
- **RECOMMENDED SPRINT:** Commercial

### Recurring commercial contracts

- **WHY IT MATTERS:** Locked-in cadence for commercial accounts — recurring revenue (goal #6).
- **REVENUE IMPACT:** Highest predictable revenue class when supply allows.
- **OPERATIONAL IMPACT:** Dedicated cleaner routing; contract change control.
- **COMPLEXITY:** High (contracts, SLAs, invoicing, multi-site).
- **DEPENDENCIES:** Quote + pipeline; invoices; consumer recurring lessons; supply.
- **RISK:** Over-commit capacity; custom one-offs explode scope.
- **PRIORITY:** P3
- **RECOMMENDED SPRINT:** Commercial

### Gift cleaning

- **WHY IT MATTERS:** Gifting expands acquisition and delight — secondary to core rebook.
- **REVENUE IMPACT:** Incremental GMV + new customer acquisition.
- **OPERATIONAL IMPACT:** Redemption edge cases (address, scheduling, expiry).
- **COMPLEXITY:** Medium (gift purchase, code, claim, booking link).
- **DEPENDENCIES:** Payments; booking path; credits/refunds clarity.
- **RISK:** Fraudulent codes; support load; distraction from MVP.
- **PRIORITY:** P3
- **RECOMMENDED SPRINT:** Growth / gift

### Reliability composite, live ETA, demand, fraud gates

- **WHY IT MATTERS:** Marketplace quality and safety at scale (see `docs/MARKETPLACE_ROADMAP.md` V3).
- **REVENUE IMPACT:** Higher completion and trust; fewer fraud losses.
- **OPERATIONAL IMPACT:** Automated risk and ETA reduce manual checks.
- **COMPLEXITY:** High (multiple subsystems; stubs exist).
- **DEPENDENCIES:** Solid V1/V2 ops data; maps; status truth.
- **RISK:** Fake sophistication; false fraud positives.
- **PRIORITY:** P3
- **RECOMMENDED SPRINT:** Marketplace V3

### Multi-job schedule optimizer / route optimization

- **WHY IT MATTERS:** Maximize cleaner day utilization (marketplace V4).
- **REVENUE IMPACT:** More jobs per cleaner-day → better margin and capacity.
- **OPERATIONAL IMPACT:** Complex dispatch; needs strong V1 truth first.
- **COMPLEXITY:** Very high (batch optimizer — interface stub only today).
- **DEPENDENCIES:** Reliable durations, travel, availability engine.
- **RISK:** Overclaiming optimizer quality; do not fake V4.
- **PRIORITY:** P3
- **RECOMMENDED SPRINT:** Marketplace V4

---

## Explicitly out until gated

| Item | Priority | Note |
|------|----------|------|
| AI features as product surface | P3 | Including AI Booking Assistant — do not implement while MVP gate open |
| Subscriptions (consumer) | P3 | Distinct from commercial contracts / saved PM |
| Visual redesign / brand rewrite | P3 | Preserve current direction; no drive-by redesign |
| Commercial quoting / pipeline / contracts | P3 | Documented above; build only after consumer loop proven |
| Referrals / gift cleaning | P3 | Growth after retention basics |

---

## Coordination

- Status and owners for the active gate: `company/CURRENT_SPRINT.md`
- Algorithm / matching detail: `docs/MARKETPLACE_ROADMAP.md`, `docs/MATCHING.md`
- Metrics placeholders only (no invented numbers): `company/METRICS.md`
- Product decisions: `company/DECISIONS.md`
