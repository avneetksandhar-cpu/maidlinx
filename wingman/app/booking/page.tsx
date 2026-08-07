import { StubPage } from "@/components/layout/StubPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking — Wingman",
};

export default function BookingPage() {
  return (
    <StubPage
      title="Booking"
      description="Confirm your reservation and payment. Coming soon."
    />
  );
}
