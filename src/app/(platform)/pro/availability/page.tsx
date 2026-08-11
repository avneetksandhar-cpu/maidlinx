import { Suspense } from "react";
import { AvailabilityCalendar } from "@/components/pro/availability-calendar";
import { ProHeader } from "@/components/pro/pro-header";
import { UnavailableDatesPanel } from "@/components/pro/unavailable-dates-panel";
import { listUnavailableDates } from "@/lib/cleaners/unavailable-dates";
import { getAvailability } from "@/lib/pro/dashboard/availability";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export const metadata = {
  title: "Availability",
};

async function AvailabilityContent() {
  const { profile } = await requireProfessionalSession();
  const [slots, blocked] = await Promise.all([
    getAvailability(profile.id),
    listUnavailableDates(profile.professionalId),
  ]);

  return (
    <>
      <ProHeader
        title="Availability"
        description="Set weekly windows and block days off so matching skips you."
      />
      <AvailabilityCalendar initialSlots={slots} />
      <UnavailableDatesPanel dates={blocked} />
    </>
  );
}

export default function ProAvailabilityPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <AvailabilityContent />
      </Suspense>
    </div>
  );
}
