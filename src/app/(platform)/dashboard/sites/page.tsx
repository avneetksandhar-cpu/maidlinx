import { Suspense } from "react";
import { SitesSelect } from "@/components/business/sites-select";
import { listSavedAddresses } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Sites",
};

async function SitesContent() {
  const { profile } = await requireCustomerSession();
  const sites = await listSavedAddresses(profile.id).catch(() => []);
  return <SitesSelect initialSites={sites} />;
}

export default function SitesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[430px] animate-pulse space-y-4">
          <div className="h-8 w-56 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="h-20 rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <SitesContent />
    </Suspense>
  );
}
