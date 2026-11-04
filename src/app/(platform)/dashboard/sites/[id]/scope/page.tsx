import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DefineScopeForm } from "@/components/business/define-scope-form";
import { getScopeForSite } from "@/lib/commercial/scopes";
import { getSavedAddressById } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Define scope",
};

async function ScopeContent({ siteId }: { siteId: string }) {
  const { profile } = await requireCustomerSession();
  const site = await getSavedAddressById(profile.id, siteId);
  if (!site) notFound();
  const serverScope = await getScopeForSite({
    siteAddressId: siteId,
    userId: profile.id,
  }).catch(() => null);

  return (
    <DefineScopeForm
      site={site}
      initialServerScope={
        serverScope
          ? {
              areas: serverScope.areas,
              frequency: serverScope.frequency,
              serviceDays: serverScope.serviceDays,
              serviceWindow: serverScope.serviceWindow,
              startDate: serverScope.startDate,
              squareFootage: serverScope.squareFootage,
              siteContact: serverScope.siteContact,
              accessNotes: serverScope.accessNotes,
              summaryPlain: serverScope.summaryPlain,
            }
          : null
      }
    />
  );
}

export default async function SiteScopePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[430px] animate-pulse space-y-4 px-5">
          <div className="h-8 w-48 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="h-40 rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <ScopeContent siteId={id} />
    </Suspense>
  );
}
