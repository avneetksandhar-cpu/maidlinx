# Availability algorithm

See [`docs/ALGORITHMS.md`](../../../docs/ALGORITHMS.md) §2 and
[`docs/MARKETPLACE_ROADMAP.md`](../../../docs/MARKETPLACE_ROADMAP.md).

**MVP:** Overlap + travel buffer + declared weekly windows before assign/accept.
Job duration from pricing rules via `resolveJobDurationMinutes`.

| Export | Role |
|--------|------|
| `checkCleanerAvailability` | Double-book + buffer + weekly window |
| `findScheduleConflict` / `intervalsConflict` | Pure interval math |
| `resolveJobDurationMinutes` | Pricing → duration for conflicts/matching |
| `suggestArrivalWindows` | Slot hints (supply-ready; synthetic today) |
| `listFreeSlots` | Cleaner-day calendar (V2 placeholder) |

Preference storage (not this package): `src/lib/pro/dashboard/availability.ts`.

Matching eligibility imports conflict checks from here — do not fork a second engine.
