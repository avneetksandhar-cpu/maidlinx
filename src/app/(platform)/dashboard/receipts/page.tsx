import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ReceiptList } from "@/components/dashboard/document-list";
import { getReceipts } from "@/lib/dashboard/bookings";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "Receipts",
};

async function ReceiptsContent() {
  const { profile, email } = await requireCustomerSession();
  const receipts = await getReceipts(profile.id, email);

  return (
    <>
      <DashboardHeader
        title="Receipts"
        description="Access payment receipts for completed services."
      />
      {receipts.length === 0 ? (
        <EmptyState
          title="No receipts yet"
          description="Receipts appear here after your clean is completed and payment is processed."
          actionLabel="Book a clean"
          actionHref={routes.book}
        />
      ) : (
        <ReceiptList receipts={receipts} />
      )}
    </>
  );
}

export default function ReceiptsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-border" />}>
        <ReceiptsContent />
      </Suspense>
    </div>
  );
}
