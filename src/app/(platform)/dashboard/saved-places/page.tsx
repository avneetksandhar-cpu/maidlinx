import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SavedPlacesManager } from "@/components/dashboard/saved-places-manager";
import { listSavedAddresses } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { routes } from "@/config/site";

export const metadata = {
  title: "Saved Places",
};

async function SavedPlacesContent() {
  const { profile } = await requireCustomerSession();
  const addresses = await listSavedAddresses(profile.id);

  return (
    <>
      <DashboardHeader
        title="Saved Places"
        description="Home, Work, and other addresses for faster booking."
      />
      {addresses.length === 0 ? (
        <EmptyState
          title="No saved places yet"
          description="Add a Home or Work address below — or save one during checkout."
          actionLabel="Book a clean"
          actionHref={routes.book}
        />
      ) : null}
      <div className={addresses.length === 0 ? "mt-4" : undefined}>
        <SavedPlacesManager initialAddresses={addresses} />
      </div>
    </>
  );
}

export default function SavedPlacesPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-border" />}>
        <SavedPlacesContent />
      </Suspense>
    </div>
  );
}
