import { StubPage } from "@/components/layout/StubPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experiences — Wingman",
};

export default function ExperiencesPage() {
  return (
    <StubPage
      title="Experiences"
      description="Browse dining, yachts, events, travel, and concierge."
    />
  );
}
