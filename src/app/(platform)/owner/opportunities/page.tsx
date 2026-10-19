import { AdminHeader } from "@/components/admin/admin-header";
import { requireOwnerAnalyticsAccess } from "@/lib/ai/session";
import { buildRevenueDirectorBrief } from "@/ai/revenue-director";
import { listOpenOpportunities } from "@/lib/owner/opportunities-store";
import { formatAdminCurrency } from "@/lib/admin/display";

export const metadata = { title: "Owner · Opportunities" };

export default async function OwnerOpportunitiesPage() {
  await requireOwnerAnalyticsAccess();
  const [brief, stored] = await Promise.all([
    buildRevenueDirectorBrief(),
    listOpenOpportunities(80),
  ]);

  return (
    <>
      <AdminHeader
        title="Revenue opportunities"
        description="Deterministic rules only — create opportunities, never auto-send messages. Dollar figures are estimates."
        badge="Estimates"
      />

      {!stored.available && (
        <p className="mb-4 text-sm text-ink-muted">
          Persisted list gap: {stored.gapReason ?? "unavailable"}. Showing live brief.
        </p>
      )}

      <section className="mb-8">
        <h2 className="font-display text-lg font-semibold text-ink">Live ranked brief</h2>
        <div className="mt-4 grid gap-4">
          {brief.opportunities.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-sm text-ink-muted">
              No opportunities yet — see gaps on the command center.
            </p>
          ) : (
            brief.opportunities.map((opp) => (
              <article
                key={opp.id}
                className="rounded-xl border border-border bg-surface p-5 shadow-card"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-ink">{opp.title}</h3>
                  <span className="text-xs uppercase text-ink-subtle">
                    {opp.category.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink">
                  Potential:{" "}
                  {opp.potentialCentsEstimate != null
                    ? formatAdminCurrency(opp.potentialCentsEstimate)
                    : "—"}{" "}
                  <span className="text-ink-subtle">(estimate)</span>
                  {" · "}
                  Confidence {Math.round(opp.confidence * 100)}%
                </p>
                <p className="mt-2 text-sm text-ink-muted">{opp.recommendedAction}</p>
                <p className="mt-1 text-xs text-ink-subtle">{opp.evidence}</p>
              </article>
            ))
          )}
        </div>
      </section>

      {stored.items.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-ink">
            Persisted open recommendations
          </h2>
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
            {stored.items.map((item) => (
              <li key={item.id} className="px-4 py-3 text-sm">
                <p className="font-medium text-ink">{item.title}</p>
                <p className="text-ink-muted">
                  {item.recommendationType} ·{" "}
                  {item.potentialCentsEstimate != null
                    ? `${formatAdminCurrency(item.potentialCentsEstimate)} (estimate)`
                    : "no $ estimate"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
