import { VenueReviewScreen } from "@/features/operator/components/VenueReviewScreen";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Venue review — Wingman" };

export default function OperatorVenuesPage() {
  return <VenueReviewScreen />;
}
