import { AdminHeader } from "@/components/admin/admin-header";
import { requireOwnerAnalyticsAccess } from "@/lib/ai/session";
import { listOwnerActivity } from "@/lib/owner/activity";
import Link from "next/link";
import { routes } from "@/config/site";

export const metadata = { title: "Owner · Activity" };

export default async function OwnerActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; eventType?: string }>;
}) {
  await requireOwnerAnalyticsAccess();
  const params = await searchParams;
  const source =
    params.source === "business_events" ||
    params.source === "ai_audit_log" ||
    params.source === "founder_interventions"
      ? params.source
      : null;

  const timeline = await listOwnerActivity({
    limit: 80,
    source,
    eventType: params.eventType || null,
  });

  const filters = [
    { href: routes.ownerActivity, label: "All" },
    { href: `${routes.ownerActivity}?source=business_events`, label: "Business events" },
    { href: `${routes.ownerActivity}?source=ai_audit_log`, label: "AI audit" },
    {
      href: `${routes.ownerActivity}?source=founder_interventions`,
      label: "Interventions",
    },
  ];

  return (
    <>
      <AdminHeader
        title="Activity timeline"
        description="business_events + AI audit + founder interventions. Soft-empty if migrations not applied."
        badge="Timeline"
      />

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        {filters.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="rounded-md border border-border bg-surface px-3 py-1.5 hover:bg-surface-muted"
          >
            {f.label}
          </Link>
        ))}
      </div>

      {!timeline.available && timeline.gapReason && (
        <p className="mb-4 text-sm text-ink-muted">{timeline.gapReason}</p>
      )}

      {timeline.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-sm text-ink-muted">
          No activity rows yet.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {timeline.items.map((item) => (
            <li key={`${item.source}-${item.id}`} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-ink">{item.summary}</p>
                <span className="text-[11px] uppercase text-ink-subtle">{item.source}</span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {item.eventType}
                {item.correlationId ? ` · corr ${item.correlationId}` : ""}
              </p>
              <p className="mt-1 text-[11px] text-ink-subtle">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
