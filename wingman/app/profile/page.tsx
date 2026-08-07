import { StubPage } from "@/components/layout/StubPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile — Wingman",
};

export default function ProfilePage() {
  return (
    <StubPage
      title="Profile"
      description="Membership, preferences, and account settings. Coming soon."
    />
  );
}
