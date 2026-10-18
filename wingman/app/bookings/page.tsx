import { BookingsScreen } from "@/features/bookings/components/BookingsScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trips — Wingman",
};

export default function BookingsPage() {
  return <BookingsScreen />;
}
