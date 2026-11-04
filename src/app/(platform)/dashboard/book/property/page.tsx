import { Suspense } from "react";
import { CommercialBookPropertyStep } from "@/components/commercial/commercial-book-property-step";
import { listSavedAddresses } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Choose property",
};

async function PropertyContent() {
  const { profile } = await requireCustomerSession();
  const sites = await listSavedAddresses(profile.id).catch(() => []);
  return <CommercialBookPropertyStep sites={sites} />;
}

export default function CommercialBookPropertyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[390px] animate-pulse space-y-4">
          <div className="h-8 w-40 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="h-24 rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <PropertyContent />
    </Suspense>
  );
}
