import { Suspense } from "react";
import { EarningsPanel } from "@/components/pro/earnings-panel";
import { ProHeader } from "@/components/pro/pro-header";
import { getEarningsHistory, getEarningsSummary } from "@/lib/pro/dashboard/earnings";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export const metadata = {
  title: "Earnings",
};

async function EarningsContent() {
  const { profile } = await requireProfessionalSession();

  const [summary, history] = await Promise.all([
    getEarningsSummary(profile.id),
    getEarningsHistory(profile.id),
  ]);

  return (
    <>
      <ProHeader
        title="Earnings"
        description="Track completed payouts and pending earnings from accepted jobs."
      />
      <EarningsPanel summary={summary} history={history} />
    </>
  );
}

export default function ProEarningsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <EarningsContent />
      </Suspense>
    </div>
  );
}
