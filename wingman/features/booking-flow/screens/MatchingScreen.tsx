"use client";

import { MatchingAnimation } from "@/components/booking-flow/MatchingAnimation";
import { PhoneFrame } from "@/components/booking-flow/PhoneFrame";
import { useStepGate } from "@/features/booking-flow/useStepGate";
import { STEP_PATHS } from "@/lib/booking-flow/copy";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STEPS = [
  "Checking availability",
  "Assigning your Wingman",
  "Preparing your night",
];

export function MatchingScreen() {
  const router = useRouter();
  const { state, hydrated } = useStepGate("matching");
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!hydrated || !state.requestId) return;
    const timers = STEPS.map((_, index) =>
      window.setTimeout(() => setDone(index + 1), 700 * (index + 1)),
    );
    const finish = window.setTimeout(() => router.replace(STEP_PATHS.wingman), 2400);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(finish);
    };
  }, [hydrated, router, state.requestId]);

  if (!hydrated) return <div className="min-h-dvh bg-[#050508]" />;

  return (
    <PhoneFrame>
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#050508] px-6 text-white">
        <MatchingAnimation />
        <h1 className="mt-8 text-[22px] font-medium tracking-[-0.02em]">Finding your Wingman</h1>
        <p className="mt-4 text-[13px] text-white/45">{STEPS[Math.max(done - 1, 0)]}</p>
      </div>
    </PhoneFrame>
  );
}
