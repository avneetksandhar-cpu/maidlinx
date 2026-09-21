"use client";

import { requiredPath } from "@/lib/booking-flow/guard";
import { useNightBooking } from "@/lib/booking-flow/provider";
import type { BookingFlowStep } from "@/lib/booking-flow/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useStepGate(step: BookingFlowStep) {
  const { state, hydrated } = useNightBooking();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    const next = requiredPath(state, step);
    if (next) router.replace(next);
  }, [hydrated, router, state, step]);

  return { state, hydrated };
}
