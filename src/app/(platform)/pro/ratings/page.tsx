import { Suspense } from "react";
import { RatingsPanel } from "@/components/pro/ratings-panel";
import { ProHeader } from "@/components/pro/pro-header";
import { getProfessionalRatings, getRatingsSummary } from "@/lib/pro/dashboard/ratings";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export const metadata = {
  title: "Ratings",
};

async function RatingsContent() {
  const { profile } = await requireProfessionalSession();

  const [summary, ratings] = await Promise.all([
    getRatingsSummary(profile.id),
    getProfessionalRatings(profile.id),
  ]);

  return (
    <>
      <ProHeader
        title="Ratings"
        description="Your reputation with customers. High ratings unlock more job opportunities."
      />
      <RatingsPanel summary={summary} ratings={ratings} />
    </>
  );
}

export default function ProRatingsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <RatingsContent />
      </Suspense>
    </div>
  );
}
