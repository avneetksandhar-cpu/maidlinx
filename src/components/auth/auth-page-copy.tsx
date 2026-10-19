"use client";

import { useSearchParams } from "next/navigation";
import { Heading, Text } from "@/components/ui";
import { isBookingAuthReturn } from "@/lib/bookings/booking-auth";

interface AuthPageCopyProps {
  mode: "sign-in" | "sign-up";
}

export function AuthPageCopy({ mode }: AuthPageCopyProps) {
  const searchParams = useSearchParams();
  const fromBooking = isBookingAuthReturn(searchParams?.get("from"));
  const role = searchParams?.get("role");
  const next = searchParams?.get("next") ?? "";
  const isCleaner =
    role === "cleaner" || next.startsWith("/cleaner") || next.startsWith("/pro");

  if (fromBooking && !isCleaner) {
    return (
      <>
        <Heading as="h1" className="text-[var(--ml-dark-ink)]">
          {mode === "sign-in" ? "Almost there" : "Save your booking"}
        </Heading>
        <Text muted className="mt-3 text-[var(--ml-dark-ink-muted)]">
          One tap with Google or Apple — or email yourself a link. Your address is already
          saved.
        </Text>
      </>
    );
  }

  if (mode === "sign-in") {
    return (
      <>
        <Heading as="h1" className="text-[var(--ml-dark-ink)]">
          Sign in
        </Heading>
        <Text muted className="mt-3 text-[var(--ml-dark-ink-muted)]">
          Continue with Google, Apple, or email.
        </Text>
      </>
    );
  }

  return (
    <>
      <Heading as="h1" className="text-[var(--ml-dark-ink)]">
        Create your account
      </Heading>
      <Text muted className="mt-3 text-[var(--ml-dark-ink-muted)]">
        {isCleaner
          ? "Customers book cleans. Cleaners apply, complete onboarding, then get approved for jobs."
          : "Continue with Google, Apple, or email — then track your cleaner."}
      </Text>
    </>
  );
}
