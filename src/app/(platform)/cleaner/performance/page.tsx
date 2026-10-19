import { Suspense } from "react";
import { CleanerPlatformStatus } from "@/components/cleaner/platform-status";
import { ProHeader } from "@/components/pro/pro-header";
import { getTrustMetrics } from "@/lib/cleaners/trust";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export const metadata = { title: "Performance" };

async function Content() {
  const { profile } = await requireProfessionalSession();
  const trust = await getTrustMetrics(profile.professionalId);

  return (
    <>
      <ProHeader
        title="Performance & trust"
        description="Internal reliability metrics. Serious flags go to admin review — never auto-fire."
      />
      <CleanerPlatformStatus />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Metric label="Trust score" value={trust ? trust.trustScore.toFixed(0) : "—"} />
        <Metric
          label="Reliability"
          value={trust ? trust.reliabilityScore.toFixed(0) : "—"}
        />
        <Metric
          label="Rating"
          value={
            trust
              ? `${trust.ratingAverage.toFixed(1)} (${trust.ratingCount})`
              : "—"
          }
        />
        <Metric
          label="Serious flags"
          value={trust ? String(trust.seriousFlagCount) : "—"}
        />
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-navy">{value}</p>
    </div>
  );
}

export default function CleanerPerformancePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <Content />
      </Suspense>
    </div>
  );
}
