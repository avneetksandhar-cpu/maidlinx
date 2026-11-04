import { MatchesScreen } from "@/features/booking-flow";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Matches — Wingman" };

export default function BookingMatchesPage() {
  return <MatchesScreen />;
}
