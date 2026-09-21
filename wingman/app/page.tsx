import { OnboardingFlow } from "@/features/onboarding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wingman",
  description: "Miami is better with the right connection.",
};

export default function LandingPage() {
  return <OnboardingFlow />;
}
