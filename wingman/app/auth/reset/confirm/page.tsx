import { ResetConfirmScreen } from "@/features/auth/components/ResetConfirmScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose a new password — Wingman",
};

export default function ResetConfirmPage() {
  return <ResetConfirmScreen />;
}
