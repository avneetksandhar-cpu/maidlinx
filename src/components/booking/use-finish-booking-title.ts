"use client";

import { useSearchParams } from "next/navigation";

/**
 * When Home resumes a mid-booking draft (`?finish=1`), title the unfinished step
 * “Finish your booking” so it’s clear the clean hasn’t been scheduled yet.
 */
export function useFinishBookingTitle(defaultTitle: string): string {
  const searchParams = useSearchParams();
  if (searchParams?.get("finish") === "1") return "Finish your booking";
  if (searchParams?.get("usual") === "1") return "Choose a new time";
  return defaultTitle;
}
