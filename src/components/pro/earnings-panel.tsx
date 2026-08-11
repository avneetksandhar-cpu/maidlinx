import { Card, CardContent } from "@/components/ui";
import type { EarningsEntry, EarningsSummary } from "@/lib/pro/dashboard/earnings";
import { formatEarnings, formatJobDate, getServiceLabel } from "@/lib/pro/dashboard/display";
import { StatusBadge } from "@/components/dashboard/status-badge";

interface EarningsPanelProps {
  summary: EarningsSummary;
  history: EarningsEntry[];
}

export function EarningsPanel({ summary, history }: EarningsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-sm text-ink-muted">Total earned</p>
            <p className="mt-1 font-display text-3xl font-semibold text-gold">
              {formatEarnings(summary.totalEarnedCents, summary.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-ink-muted">Pending</p>
            <p className="mt-1 font-display text-3xl font-semibold text-ink">
              {formatEarnings(summary.pendingCents, summary.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-ink-muted">Completed jobs</p>
            <p className="mt-1 font-display text-3xl font-semibold text-ink">
              {summary.completedJobs}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">Earnings history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-ink-muted">No earnings yet. Accept your first job to get started.</p>
        ) : (
          history.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-ink">{getServiceLabel(entry.serviceType)}</p>
                  <p className="mt-1 text-sm text-ink-muted">{formatJobDate(entry.scheduledAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={entry.status} />
                  <p className="font-medium text-gold">
                    {formatEarnings(entry.earningsCents, entry.currency)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
