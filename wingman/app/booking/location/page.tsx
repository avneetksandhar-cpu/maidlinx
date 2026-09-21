import { LocationScreen } from "@/features/booking-flow";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Where tonight — Wingman" };

export default function BookingLocationPage() {
  return <LocationScreen />;
}
