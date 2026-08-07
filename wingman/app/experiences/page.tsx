import { AppStubPage } from "@/components/layout/AppStubPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experiences — Wingman",
};

export default function ExperiencesPage() {
  return (
    <AppStubPage
      title="Experiences"
      description="Browse dining, yachts, events, travel, and concierge. Coming soon."
    />
  );
}
