import { Suspense } from "react";
import Link from "next/link";
import { InvoiceList, ReceiptList } from "@/components/dashboard/document-list";
import { getInvoices, getReceipts } from "@/lib/dashboard/bookings";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "Billing",
};

async function BillingContent() {
  const { profile, email } = await requireCustomerSession();
  const [invoices, receipts] = await Promise.all([
    getInvoices(profile.id, email),
    getReceipts(profile.id, email),
  ]);

  return (
    <div className="mx-auto w-full max-w-[430px] space-y-8 lg:max-w-none">
      <header className="space-y-1">
        <h1 className="text-[1.85rem] font-bold tracking-tight text-white">Billing</h1>
        <p className="text-[15px] text-[var(--ml-dark-ink-muted)]">
          Agreed prices, invoices, and payment status per site. Sample mockup amounts are illustrative only — figures here are from real bookings.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-white">Invoices</h2>
        {invoices.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-8 text-center text-sm text-[var(--ml-dark-ink-muted)]">
            No invoices yet. They appear when a commercial visit is confirmed.
          </p>
        ) : (
          <InvoiceList invoices={invoices} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-white">Receipts</h2>
        {receipts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-8 text-center text-sm text-[var(--ml-dark-ink-muted)]">
            No receipts yet. Receipts post after payment completes (Stripe TEST only).
          </p>
        ) : (
          <ReceiptList receipts={receipts} />
        )}
      </section>

      <p className="text-center text-xs text-[var(--ml-dark-ink-subtle)]">
        <Link href={routes.dashboardProfile} className="text-[#04CED2] underline-offset-2 hover:underline">
          Account settings
        </Link>
      </p>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[430px] animate-pulse space-y-4">
          <div className="h-8 w-40 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="h-28 rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
