import { Suspense } from "react";
import { AvailabilityCalendar } from "@/components/pro/availability-calendar";
import { ProHeader } from "@/components/pro/pro-header";
import { getAvailability } from "@/lib/pro/dashboard/availability";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export const metadata = {
  title: "Availability",
};

async function AvailabilityContent() {
  const { profile } = await requireProfessionalSession();
  const slots = await getAvailability(profile.id);

  return (
    <>
      <ProHeader
        title="Availability"
        description="Set your weekly schedule so MaidLinx can match you with the right jobs."
      />
      <AvailabilityCalendar initialSlots={slots} />
    </>
  );
}

export default function ProAvailabilityPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <AvailabilityContent />
      </Suspense>
    </div>
  );
}
