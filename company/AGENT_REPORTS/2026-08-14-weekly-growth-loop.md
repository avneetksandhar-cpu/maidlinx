# Weekly growth operating loop — 2026-08-14

**Roles:** CTO + CGO + Product Strategist + Ops Architect  
**Branch / PR:** `split/o-launch-gate` · PR #16  
**NO_PAID_ADS_ASSUMED:** true  
**GTA_ACTIVE / FL_ACTIVE:** true (separate experiments)  
**Stripe LIVE:** OFF · **Markets:** CLOSED until bookable supply

---

## #1 growth constraint (with evidence)

**SUPPLY — zero bookable cleaners in either market.**

| Evidence | Value (2026-08-14 live Supabase `pgoyhujsfbmfshtnlbnx`) |
|----------|--------------------------------------------------------|
| `BOOKABLE_CLEANERS` | **0** (approved cleaner `ba902d50-…` has market=null, zones=0, services=0, offline) |
| Cleaners total | **2** (1 approved+active incomplete · 1 applicant inactive) |
| `/earn` `application_submitted_at` | **0** |
| Markets | SOUTH_FLORIDA + TORONTO_GTA · `booking_enabled=false` · `launch_enabled=false` |
| FL Facebook organic | **8** groups published (not paid) |
| GTA Facebook organic | **0** published (prior composer failures) |
| Paid recruitment ads | **Not using** |

Bottleneck is not “marketing activity” — it is **applications → screened strong → ops-complete bookable depth** in at least one zone of either ACTIVE market. Demand, paid ads, and market open are gated.

---

## Top 3 highest-leverage opportunities

| # | Opportunity | Impact | Confidence | Cost | Speed |
|---|-------------|--------|------------|------|-------|
| 1 | **Convert organic FL attention → `/earn` apps + screen** (engage 8 posted groups; optional Craigslist/DMs) | High — only path to FL bookable | Med | Founder time | Days |
| 2 | **Publish GTA organic FB (5–8 groups)** from prepared pack — currently 0 posts | High — opens second independent supply funnel | Med (composer risk) | Founder time | Hours–1 day |
| 3 | **Ops-complete first strong applicants → ≥2 bookable same zone** (whichever market converts first) | Critical — unlocks liquidity proof | High if apps exist | Founder ops time | After apps |

---

## Status board

### DONE
- Growth OS + backlog encoded; **corrected to dual-geo ACTIVE** (not FL-only / GTA deferred)
- Live DB verify: BOOKABLE=0, markets closed, apps submitted=0, cleaners=2
- FL organic FB wave: **8** published (documented; organic only)
- Dual-geo recruiting kit + GTA approval pack + applicant source tracker
- Weekly loop report (this file)
- Launch Gate controlled TEST path previously proven; Stripe LIVE stays OFF

### IN PROGRESS
- FL organic recruitment → waiting on applications
- Applicant attribution hygiene (tracker ready; empty until apps)

### BLOCKED
- Bookable coverage / market open / Stripe LIVE (blocked on supply depth)
- Paid ads (blocked until organic proves app→bookable; not assumed)
- P1 liquidity TEST jobs (gated on ≥2 bookable in one zone of one market)

### RECOMMENDED
- Retry GTA organic FB using `company/growth/cleaner-recruiting/GTA_FB_READY_FOR_APPROVAL.md` (5–8 groups, no spam)
- Parallel free channels: Kijiji (GTA), Craigslist/local (FL), respectful DMs, referrals
- Screen same-day when apps arrive; log source in `applicant-source-tracker.md`

### NEEDS HUMAN APPROVAL
- **Publish GTA Facebook organic posts** (copy + shortlist prepared — do not auto-spam)
- Any paid acquisition (explicitly later)
- Enabling `booking_enabled` / Stripe LIVE / Connect LIVE / wallet LIVE
- Inventing or completing ops data for `ba902d50` without verified market facts

---

## Exact human actions (founder)

1. **Approve GTA post copy** in `GTA_FB_READY_FOR_APPROVAL.md` → publish ≤8 organic GTA groups (or ask agent to execute after approval).  
2. **Monitor `/earn` + reply** to FL group comments; DM promising independents (IC-safe).  
3. **Screen every applicant** same day; log market + channel in `company/growth/applicant-source-tracker.md`.  
4. For strong fits only: complete **market / zones / services / availability** in `/owner` until **2+ bookable same zone**.  
5. Keep **booking OFF** and **Stripe LIVE OFF** until that depth exists.  
6. Optional: Kijiji (GTA) + Craigslist (FL) listings using kit copy.

---

## Experiment backlog (hypothesis · metric · success)

| ID | Hypothesis | Metric | Success threshold |
|----|------------|--------|-------------------|
| EX-FL-FB | FL organic FB groups produce `/earn` apps | FL apps attributed `fb_group` | ≥10 FL apps in 14 days OR clear channel kill signal |
| EX-GTA-FB | GTA organic FB (retry) produces `/earn` apps | GTA groups published + GTA apps | ≥5 GTA posts published this week; then ≥10 GTA apps in 14 days |
| EX-GTA-KIJ | Kijiji adds incremental GTA apps beyond FB | GTA apps attributed `kijiji` | ≥3 Kijiji-attributed apps in 14 days else pause |
| EX-FL-DM | Respectful FL DMs convert independents | FL apps attributed `dm` | ≥3 DM-attributed apps in 14 days else pause |
| EX-OPS | Strong applicants can become bookable without product work | Bookable in one zone | ≥2 bookable same area in first converting market |

---

## Explicit non-claims

- No fabricated posts, leads, revenue, or bookable counts.  
- Organic FL = 8 · Organic GTA = 0 · Paid ads = none.  
- Existing DB cleaners are **not** bookable capacity.

## Board files touched this loop

- `GROWTH_OPERATING_SYSTEM.md` · `GROWTH_BACKLOG.md` · `CURRENT_SPRINT.md` · `DECISIONS.md` · `ROADMAP.md` · `AGENTS.md`  
- `company/growth/cleaner-recruiting/*` · `company/growth/applicant-source-tracker.md`
