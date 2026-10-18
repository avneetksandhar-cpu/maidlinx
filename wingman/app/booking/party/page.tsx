import { PartyScreen } from "@/features/booking-flow";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Party — Wingman" };

export default function BookingPartyPage() {
  return <PartyScreen />;
}
