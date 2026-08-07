import { StubPage } from "@/components/layout/StubPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages — Wingman",
};

export default function MessagesPage() {
  return (
    <StubPage
      title="Messages"
      description="Connect with hosts and concierge. Coming soon."
    />
  );
}
