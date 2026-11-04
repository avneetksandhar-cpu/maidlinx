import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DefineScopeForm } from "@/components/business/define-scope-form";
import { getSavedAddressById } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Define scope",
};

async function ScopeContent({ siteId }: { siteId: string }) {
  const { profile } = await requireCustomerSession();
  const site = await getSavedAddressById(profile.id, siteId);
  if (!site) notFound();
  return <DefineScopeForm site={site} />;
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
        <div className="mx-auto max-w-[430px] animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="h-40 rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <ScopeContent siteId={id} />
    </Suspense>
  );
}
