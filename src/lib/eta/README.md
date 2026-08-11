# ETA

See [`docs/ALGORITHMS.md`](../../../docs/ALGORITHMS.md) §3.

| Export | Status |
|--------|--------|
| `estimateTravelMinutes` | **V1** — haversine + average speed |
| `estimateArrival` | V1 simple; Maps/traffic later |

Used by customer confirmation/dashboard when cleaner + job coordinates exist.
Matching Travel Fit uses the same speed threshold (`MATCH_THRESHOLDS.averageSpeedKmh`).

**Closest ≠ quickest** — prefer minutes over raw distance in product copy and ranking.
