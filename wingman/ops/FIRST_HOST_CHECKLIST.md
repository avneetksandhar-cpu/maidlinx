# Wingman — first host ops checklist

**Purpose:** Get **one** real Miami host ready to fulfill $500 night service — without inventing a verified marketplace profile.  
**Current product truth:** assigned host is **Andres P**. Public verified Wingmen = **0**. Government ID = **not** verified. No photo. No reviews. Stripe **TEST** only.

There are two different bars. Do not mix them.

| Track | What guests see | When to use |
| --- | --- | --- |
| **A. Closed-beta host** | “Your Wingman · Andres P” — unpublished, not verified | Friends / manager TEST nights |
| **B. Public verified Wingman** | Listed on `/wingmen`, `verification_status = verified` | Only after **all** gates below |

The code will not set `verified` until every gate on the application is stamped (`verifyWingmanFromApplication`). Do not SQL-flip that flag.

---

## Track A — closed beta with Andres (do this first)

Andres can take assigned $500 TEST nights **without** being a public verified profile. That is already how `/book` works.

### Founder / manager (human)

- [ ] **Named approver** — who says yes: founder, manager, or operator? Write the name here: ________
- [ ] **Written consent** from Andres to be the assigned host for closed-beta nights (email is enough). Not a public listing.
- [ ] **Legal / insurance** — decide: remote/chat-only for now, **or** in-person after counsel. In-person service is an owner blocker until this is decided. See `ops/MANAGER_ASKS.md`.
- [ ] **Signed compensation** — 10% + $200/mo (or whatever you actually sign). Last recorded status: **not signed**. Store the PDF off-repo. Do not commit IDs or bank details.
- [ ] **Phone + email** you can reach the same night (not published).
- [ ] **Service boundary he agrees to say:** the $500 is start-the-night service — not a table, guest list, admission, or romance. Copy already on `/book`.
- [ ] **Availability window** for the first TEST week (nights / response time). Subject to availability — not a guarantee.

### Do not do on Track A

- Do not upload a photo or write a bio story
- Do not add reviews, Instagram, age, or a last name you invented
- Do not set `verification_status = 'verified'`
- Do not create a bookable venue offer (tables at LIV / E11EVEN / etc.)
- Do not send paid ads
- Do not put ID scans or payout account numbers in this repo

### Operator TEST (after Vercel host exists)

Use [`VERCEL_ENV_CHECKLIST.md`](./VERCEL_ENV_CHECKLIST.md) first if you want this on HTTPS. Local `:3005` is enough to practice.

- [ ] Guest account (not the operator) books `/book` → $500 Stripe **TEST**
- [ ] Webhook marks paid / confirmed
- [ ] Chat unlocks — Andres (or operator sitting in) replies
- [ ] Scope line is clear to the guest
- [ ] Cancel-unpaid still works
- [ ] No TEST fixture names on `/events` or `/wingmen`

**Track A done when:** Andres has consented + you have a signed (or explicitly deferred) pay deal + one paid TEST night he actually handled in chat. Still **0** public verified Wingmen. That is correct.

---

## Track B — first *public* verified Wingman (later)

Invitation ≠ verified. Venue emails already sent (7) with **0** replies — see `ops/WINGMAN_OUTREACH_DRAFTS.md`.

The app requires **all** of these gates on `wingman_applications` before verify:

| Gate | Meaning (operator stamps when true) |
| --- | --- |
| `consent` | Written consent to create and **display** a profile |
| `identity` | Identity check completed |
| `gov_id` | Government ID reviewed (store off-repo) |
| `selfie_liveness` | Selfie / liveness check |
| `phone` | Phone verified |
| `email` | Email verified |
| `emergency_contact` | Emergency contact on file |
| `screening_manual` | Manual screening pass |
| `code_of_conduct` | Conduct accepted |
| `service_boundary` | No romance / no guaranteed people / no guaranteed entry |
| `inventory_authority` | Proof they may represent a venue (email, contract, roster, manager). Social posts are not enough |
| `agreement` | Signed Wingman agreement |
| `payout` | Payout details match the agreement (secure, not published) |
| `payment_auth` | Payment / charge authority understood |
| `no_show_policy` | No-show / cancel terms accepted |
| `policy` | Platform policy accepted |
| `media` | Photo/bio cleared for public use |
| `test_booking` | Operator ran request → quote → chat (or $500 TEST night) with this person |

Operator actions live under `/operator` (`markVerificationGate` / `verifyWingmanFromApplication`). Incomplete checklist → verify API errors.

### After Track B verify

- [ ] `/api/wingmen` `count` is **1** (or more) — only then claim a public host
- [ ] Still **0** bookable venue offers until that host has approved inventory
- [ ] Stripe stays **TEST** until founder enables live
- [ ] Do not announce venue partnerships

---

## Open product questions (do not assume)

Still unsigned in `ops/MANAGER_ASKS.md`:

1. Verified Wingman vs Promoter — one person or two roles?
2. Who approves (same as the name on Track A)?
3. US vs Canada legal entity for a future live Stripe account
4. In-person vs remote-only until insurance exists

---

## Suggested order this week

1. Finish Vercel + one paid TEST night on HTTPS (`VERCEL_ENV_CHECKLIST.md`)
2. Complete Track A with Andres (consent, pay terms, one night he handles)
3. Keep recruiting; do not wait on LIV / M2 / Factory Town replies
4. Start Track B only when you have ID + signed agreement + counsel on in-person
