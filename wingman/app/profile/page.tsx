import { AppStubPage } from "@/components/layout/AppStubPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile — Wingman",
};

export default function ProfilePage() {
  return (
    <AppStubPage
      title="Profile"
      description="Membership, preferences, and account settings. Coming soon."
    />
  );
}
