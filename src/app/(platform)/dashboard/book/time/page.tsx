import { Suspense } from "react";
import { CommercialBookTimeStep } from "@/components/commercial/commercial-book-time-step";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Preferred time",
};

async function TimeContent() {
  await requireCustomerSession();
  return <CommercialBookTimeStep />;
}

export default function CommercialBookTimePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[390px] animate-pulse space-y-4">
          <div className="h-8 w-40 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="h-24 rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <TimeContent />
    </Suspense>
  );
}
