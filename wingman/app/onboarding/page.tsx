import { OnboardingFlow } from "@/features/onboarding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome — Wingman",
  description: "Discover exclusive luxury experiences.",
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
