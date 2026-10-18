import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";

export default function PoliciesPage() {
  return (
    <AppShell>
      <AppHeader title="Policies" showBack backHref="/" />
      <h1 className="text-2xl text-ink">Policies and support</h1>
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-muted">
        <p>A request is not a reservation. Nothing is held until you accept a quote and pay.</p>
        <p>
          Cancellation: unpaid requests can be cancelled from the night detail. After payment
          confirms, only an operator can cancel or refund. Venue admission is never sold here, so a
          cancelled Wingman night is not a cancelled table.
        </p>
        <p>The $500 USD minimum is the lowest total booking value. It is not automatically a deposit.</p>
        <p>Customer fees and supplier commissions are set by an admin. They are not a hidden take rate.</p>
        <p>The developer agreement of 10% of monthly revenue plus $200/month is not a customer fee.</p>
        <p>Discovery listings are official venue calendar events. They do not imply a Wingman partnership.</p>
        <p>Unverified applicants never appear publicly and never receive Wingman permissions.</p>
        <p>Open a support case from any request if something goes wrong during the night.</p>
        <p>Cards are processed securely and are never stored on Wingman servers.</p>
        <p>
          Women are never inventory. Wingman does not offer romantic or sexual companionship and does
          not guarantee entry, tables, a specific crowd, or access to specific people.
        </p>
        <p>
          Insurance and legal review for in-person services is an owner blocker. This app does not
          claim that insurance exists today.
        </p>
      </div>
    </AppShell>
  );
}
