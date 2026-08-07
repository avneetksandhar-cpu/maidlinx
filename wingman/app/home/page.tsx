import { StubPage } from "@/components/layout/StubPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home — Wingman",
};

export default function HomePage() {
  return (
    <StubPage
      title="Home"
      description="Your curated feed of exclusive experiences. Coming soon."
    />
  );
}
