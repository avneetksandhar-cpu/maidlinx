import { ConfirmScreen } from "@/features/booking-flow";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confirm request — Wingman" };

export default function BookingConfirmPage() {
  return <ConfirmScreen />;
}
