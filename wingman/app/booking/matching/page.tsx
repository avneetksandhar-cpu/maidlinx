import { MatchingScreen } from "@/features/booking-flow";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Matching — Wingman" };

export default function BookingMatchingPage() {
  return <MatchingScreen />;
}
