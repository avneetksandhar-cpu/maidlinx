"use client";

import { BookingStepShell } from "@/components/booking-flow/BookingStepShell";
import { WingmanProfileCard } from "@/components/booking-flow/WingmanProfileCard";
import { useStepGate } from "@/features/booking-flow/useStepGate";
import { STEP_PATHS } from "@/lib/booking-flow/copy";
import { ASSIGNED_HOST_NAME } from "@/lib/marketplace/host-copy";
import { useRouter } from "next/navigation";

export function WingmanFoundScreen() {
  const router = useRouter();
  const { state, hydrated } = useStepGate("wingman");
  if (!hydrated) return <div className="min-h-dvh bg-[#050508]" />;

  const offer = state.confirmedOffer;
  const name = offer?.hostName || ASSIGNED_HOST_NAME;

  return (
    <BookingStepShell
      title="Your Wingman is ready"
      backHref={STEP_PATHS.confirm}
      showProgress={false}
      cta="Continue to payment"
      onContinue={() => router.push(STEP_PATHS.payment)}
    >
      <div className="pt-6">
        <WingmanProfileCard
          name={name}
          verified={Boolean(offer?.publicVerified)}
          photoUrl={offer?.photoUrl ?? null}
        />
        <p className="mx-auto mt-8 max-w-[16rem] text-center text-[13px] leading-5 text-white/50">
          {name.split(" ")[0]} will take the night from here.
        </p>
      </div>
    </BookingStepShell>
  );
}
