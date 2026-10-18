import { VenueApplyScreen } from "@/features/venues/VenueApplyScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "List your venue — Wingman",
};

export default function VenueApplyPage() {
  return <VenueApplyScreen />;
}
