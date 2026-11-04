import { TestBookingStart } from "@/features/test-booking/TestBookingStart";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operator TEST booking — Wingman",
  robots: { index: false, follow: false },
};

export default function OperatorTestBookingPage() {
  return <TestBookingStart />;
}
