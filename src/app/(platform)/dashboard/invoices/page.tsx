import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { InvoiceList } from "@/components/dashboard/document-list";
import { getInvoices } from "@/lib/dashboard/bookings";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "Invoices",
};

async function InvoicesContent() {
  const { profile, email } = await requireCustomerSession();
  const invoices = await getInvoices(profile.id, email);

  return (
    <>
      <DashboardHeader
        title="Invoices"
        description="Download and review invoices for confirmed and completed bookings."
      />
      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Invoices are generated when your booking is confirmed."
          actionLabel="Book a clean"
          actionHref={routes.book}
        />
      ) : (
        <InvoiceList invoices={invoices} />
      )}
    </>
  );
}

export default function InvoicesPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-border" />}>
        <InvoicesContent />
      </Suspense>
    </div>
  );
}
