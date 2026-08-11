# Maidlinx MVP Scope (first functional release)

## Customer flow

Address → Service → Price → Date/Time → Pay deposit → Confirmation

## Cleaner flow

Sign up/login → Available/assigned jobs → Accept → Customer/job details → On the way → Arrived → Started → Completed

## Admin

Bookings, customers, cleaners, payments, statuses, manual cleaner assignment

## Booking status lifecycle

| Status | Description |
|--------|-------------|
| `pending_payment` | Booking created; awaiting Stripe deposit |
| `confirmed` | Deposit received (transient; immediately advances) |
| `awaiting_assignment` | Paid; waiting for cleaner assignment or self-accept |
| `assigned` | Cleaner assigned (admin or self-accept) |
| `on_the_way` | Cleaner en route to job |
| `arrived` | Cleaner at the property |
| `in_progress` | Clean underway |
| `completed` | Job finished |
| `cancelled` | Booking cancelled |

### Flow diagram

```
Customer:  pending_payment ──(Stripe deposit)──► confirmed ──► awaiting_assignment
Admin:                                              awaiting_assignment ──(assign)──► assigned
Cleaner:   awaiting_assignment ──(accept, optional)──► assigned
           assigned ──► on_the_way ──► arrived ──► in_progress ──► completed
Any:       * ──(cancel)──► cancelled
```

## Required

- Stripe payments
- Email/SMS confirmations
- Secure auth
- Database
- Mobile-friendly / PWA

## Out of scope v1

- AI
- Subscriptions
- Referrals
- Auto-matching
- Commercial quoting

## Phase roadmap (algorithms)

Long-term systems architecture: [`docs/ALGORITHMS.md`](docs/ALGORITHMS.md). Module stubs live under `src/lib/` (types + TODOs only, except pricing and the dispatch match-score work).

### MVP (implement next, in order)

1. **Service-area basics** — Toronto / South Florida zone eligibility (`src/lib/service-area/`)
2. **Availability** — no double-booking; travel + job duration (`src/lib/availability/`)
3. **Dispatch / match score** — best-cleaner ranking for **admin assignment** (`src/lib/matching/` = Dispatch algorithm v1). Auto-matching stays out of scope for v1.
4. **Pricing** — already shipped for quotes (`src/lib/pricing/`); extend carefully for frequency/geo later

### Later

- ETA arrival prediction (`src/lib/eta/`)
- Cleaner reliability composite (`src/lib/reliability/`)
- Repeat-match / liked-cleaner preference (`src/lib/repeat-match/`)
- Demand forecasting (`src/lib/demand/`)
- Fraud / risk (`src/lib/fraud/`)
- Recommendations — recurring & extras (`src/lib/recommendations/`)
