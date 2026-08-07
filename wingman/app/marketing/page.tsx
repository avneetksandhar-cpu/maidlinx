import { LandingPage } from "@/components/marketing/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wingman — Private Access to Miami's Finest",
  description:
    "Access Miami's most exclusive experiences. Verified hosts, VIP dining, yacht charters, and members-only nightlife.",
};

export default function MarketingPage() {
  return <LandingPage />;
}
