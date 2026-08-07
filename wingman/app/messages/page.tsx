import { AppStubPage } from "@/components/layout/AppStubPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages — Wingman",
};

export default function MessagesPage() {
  return (
    <AppStubPage
      title="Messages"
      description="Connect with hosts and concierge. Coming soon."
    />
  );
}
