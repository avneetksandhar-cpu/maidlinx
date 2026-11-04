import { VenueDeskScreen } from "@/features/venues/VenueDeskScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Venue desk — Wingman",
};

export default function VenueDeskPage() {
  return <VenueDeskScreen />;
}
