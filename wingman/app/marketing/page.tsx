import { LandingPage } from "@/components/marketing/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wingman — Your person in Miami",
  description:
    "A trusted insider who knows your taste, organises the night, and helps when plans change. A request is not a reservation.",
};

export default function MarketingPage() {
  return <LandingPage />;
}
