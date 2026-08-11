import Link from "next/link";
import { Suspense } from "react";
import { CapabilitiesForm } from "@/components/pro/capabilities-form";
import { ProHeader } from "@/components/pro/pro-header";
import { Card, CardContent } from "@/components/ui";
import { routes } from "@/config/site";
import {
  catalogServicesForUi,
  catalogZonesForUi,
  getCleanerCapabilities,
} from "@/lib/pro/dashboard/capabilities";
import { getJobHistory } from "@/lib/pro/dashboard/jobs";
import { getRatingsSummary } from "@/lib/pro/dashboard/ratings";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { formatEarnings, formatJobDate, getServiceLabel } from "@/lib/pro/dashboard/display";

export const metadata = {
  title: "Cleaner settings",
};

async function SettingsContent() {
  const { profile } = await requireProfessionalSession();

  const [capabilities, history, ratings] = await Promise.all([
    getCleanerCapabilities(profile.id),
    getJobHistory(profile.id, 10),
    getRatingsSummary(profile.id),
  ]);

  const links = [
    { href: routes.cleanerAvailability, label: "Availability", hint: "Weekly windows" },
    { href: routes.cleanerProfile, label: "Profile", hint: "Name, bio, radius" },
    { href: routes.cleanerRatings, label: "Ratings", hint: "Customer feedback" },
    { href: `${routes.cleanerJobs}?tab=earnings`, label: "Earnings", hint: "Payouts & history" },
  ];

  return (
    <>
      <ProHeader
        title="Settings"
        description="Manage availability, services, zones, history, and payouts."
      />

      <div className="mb-6 grid gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex min-h-14 items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-teal-muted/40"
          >
            <div>
              <p className="font-medium text-navy">{link.label}</p>
              <p className="text-sm text-ink-muted">{link.hint}</p>
            </div>
            <span className="text-teal">→</span>
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-sm text-ink-muted">Rating</p>
            <p className="mt-1 font-display text-2xl font-semibold text-navy">
              {ratings.average.toFixed(1)} ★
            </p>
            <p className="text-xs text-ink-subtle">{ratings.count} reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-ink-muted">Completed jobs</p>
            <p className="mt-1 font-display text-2xl font-semibold text-navy">
              {history.length}
            </p>
            <p className="text-xs text-ink-subtle">Recent history below</p>
          </CardContent>
        </Card>
      </div>

      <CapabilitiesForm
        initialServiceIds={capabilities?.serviceIds ?? []}
        initialZoneIds={capabilities?.zoneIds ?? []}
        hasVehicle={capabilities?.hasVehicle ?? false}
        travelRadiusKm={capabilities?.travelRadiusKm ?? profile.serviceRadiusKm}
        services={catalogServicesForUi()}
        zones={catalogZonesForUi()}
        payoutStatus={capabilities?.payoutStatus ?? "not_connected"}
      />

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-lg font-semibold text-navy">Job history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-ink-muted">No completed jobs yet.</p>
        ) : (
          history.map((job) => (
            <Link
              key={job.id}
              href={routes.cleanerJob(job.id)}
              className="flex min-h-14 items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
            >
              <div>
                <p className="font-medium text-ink">{getServiceLabel(job.serviceType)}</p>
                <p className="text-sm text-ink-muted">{formatJobDate(job.scheduledAt)}</p>
              </div>
              <p className="font-medium text-teal">
                {formatEarnings(job.subtotalCents, job.currency)}
              </p>
            </Link>
          ))
        )}
      </section>
    </>
  );
}

export default function ProSettingsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
