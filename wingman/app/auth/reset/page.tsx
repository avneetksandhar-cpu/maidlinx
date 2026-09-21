import { ResetRequestScreen } from "@/features/auth/components/ResetRequestScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password — Wingman",
};

export default function ResetRequestPage() {
  return <ResetRequestScreen />;
}
