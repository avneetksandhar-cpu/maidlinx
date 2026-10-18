import { AuthScreen } from "@/features/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Wingman",
  description: "Sign in to plan an evening with your person in Miami.",
};

export default function AuthPage() {
  return <AuthScreen />;
}
