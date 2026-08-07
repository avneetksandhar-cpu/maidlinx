import { StubPage } from "@/components/layout/StubPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Wingman",
};

export default function AdminPage() {
  return (
    <StubPage
      title="Admin"
      description="Host verification, experience management, and analytics. Coming soon."
    />
  );
}
