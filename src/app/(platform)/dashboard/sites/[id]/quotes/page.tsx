import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompareQuotes } from "@/components/business/compare-quotes";
import { getSavedAddressById } from "@/lib/dashboard/addresses";
import { getCustomerBookings } from "@/lib/dashboard/bookings";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Compare quotes",
};

async function QuotesContent({ siteId }: { siteId: string }) {
  const { profile, email } = await requireCustomerSession();
  const site = await getSavedAddressById(profile.id, siteId);
  if (!site) notFound();

  const upcoming = await getCustomerBookings(profile.id, email, "upcoming").catch(
    () => [],
  );
  const line1 = site.addressLine1.trim().toLowerCase();
  const realJobs = upcoming
    .filter((b) => (b.addressLine1 ?? "").trim().toLowerCase() === line1)
    .map((b) => ({
      id: b.id,
      professionalName: b.professionalName,
      totalCents: b.totalCents,
      currency: b.currency,
      status: b.status,
      scheduledAt: b.scheduledAt,
    }));

  const defaultName = [profile.firstName, profile.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <CompareQuotes
      site={site}
      realJobs={realJobs}
      defaultEmail={email}
      defaultName={defaultName || null}
    />
  );
}

export default async function SiteQuotesPage({
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
      <QuotesContent siteId={id} />
    </Suspense>
  );
}
