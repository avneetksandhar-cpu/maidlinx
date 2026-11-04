import { Suspense } from "react";
import { CommercialBookHome } from "@/components/commercial/commercial-book-home";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Book a commercial clean",
};

async function BookHome() {
  await requireCustomerSession();
  return <CommercialBookHome />;
}

export default function CommercialBookPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[390px] animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-[var(--ml-dark-surface)]" />
          <div className="aspect-[16/10] rounded-2xl bg-[var(--ml-dark-surface)]" />
        </div>
      }
    >
      <BookHome />
    </Suspense>
  );
}
