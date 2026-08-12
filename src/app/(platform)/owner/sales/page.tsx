import { AdminHeader } from "@/components/admin/admin-header";
import { requireOwnerAnalyticsAccess } from "@/lib/ai/session";
import { listSalesLeads, huntCommercialBookingCandidates } from "@/lib/owner/sales";
import { formatAdminCurrency } from "@/lib/admin/display";
import { OwnerSalesForm } from "@/components/owner/owner-sales-form";
import { OwnerSalesLeadActions } from "@/components/owner/owner-sales-lead-actions";

export const metadata = { title: "Owner · Sales CRM" };

export default async function OwnerSalesPage() {
  await requireOwnerAnalyticsAccess();
  const [leads, commercial] = await Promise.all([
    listSalesLeads(100),
    huntCommercialBookingCandidates(),
  ]);

  const open = leads.items.filter((l) => l.status === "open");
  const byStage = new Map<string, number>();
  for (const l of open) {
    byStage.set(l.stage, (byStage.get(l.stage) ?? 0) + 1);
  }
  return (
    <>
      <AdminHeader
        title="B2B / commercial sales"
        description="Internal CRM. Manual leads only — estimated dollars labeled. Stale follow-ups become opportunities (no auto email)."
        badge="CRM"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="text-ink-muted">Open leads</p>
          <p className="mt-1 font-display text-xl font-semibold">{open.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="text-ink-muted">Commercial bookings (sample)</p>
          <p className="mt-1 font-display text-xl font-semibold">
            {commercial.available ? commercial.count : "—"}
          </p>
          {commercial.estimatedCents != null && (
            <p className="mt-1 text-xs text-ink-subtle">
              {formatAdminCurrency(commercial.estimatedCents)} historical (estimate for expansion)
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="text-ink-muted">Pipeline stages</p>
          <p className="mt-1 text-xs text-ink">
            {Array.from(byStage.entries())
              .map(([s, n]) => `${s}:${n}`)
              .join(" · ") || "—"}
          </p>
        </div>
      </div>

      {!leads.available && (
        <p className="mb-4 text-sm text-ink-muted">{leads.gapReason}</p>
      )}

      <OwnerSalesForm />

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Pipeline</h2>
        {leads.items.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-sm text-ink-muted">
            No leads yet — add manually. Do not invent customers.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {leads.items.map((lead) => {
              return (
                <li
                  key={lead.id}
                  className="rounded-xl border border-border bg-surface p-4 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-semibold text-ink">
                        {lead.companyName}
                        {lead.staleFollowUp && (
                          <span className="ml-2 text-xs font-normal text-rose-700">
                            stale follow-up
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs uppercase text-ink-subtle">
                        {lead.segment} · {lead.stage} · {lead.status}
                      </p>
                      <p className="mt-2 text-sm text-ink-muted">
                        {[lead.contactName, lead.contactEmail, lead.contactPhone]
                          .filter(Boolean)
                          .join(" · ") || "No contact"}
                      </p>
                      {lead.estimatedMonthlyCents != null && (
                        <p className="mt-1 text-xs text-ink-subtle">
                          Est. monthly {formatAdminCurrency(lead.estimatedMonthlyCents)} (estimate)
                        </p>
                      )}
                      {lead.nextFollowUpAt && (
                        <p className="mt-1 text-xs text-ink-muted">
                          Next follow-up {new Date(lead.nextFollowUpAt).toLocaleString()}
                        </p>
                      )}
                      {lead.ownerNotes && (
                        <p className="mt-2 text-sm text-ink">{lead.ownerNotes}</p>
                      )}
                    </div>
                    <OwnerSalesLeadActions id={lead.id} stage={lead.stage} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
