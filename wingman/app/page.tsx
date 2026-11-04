import { LandingSplash } from "@/features/onboarding/components/LandingSplash";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wingman",
  description: "Miami is better with the right connection.",
};

export default function LandingPage() {
  return (
    <>
      <link rel="preload" as="image" href="/photos/login-opening.jpg" />
      <link rel="preload" as="image" href="/brand/logo.png" />
      <LandingSplash />
    </>
  );
}
