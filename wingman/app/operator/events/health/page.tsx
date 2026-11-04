import { SourceHealthScreen } from "@/features/operator/components/SourceHealthScreen";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Source health — Wingman" };

export default function OperatorSourceHealthPage() {
  return <SourceHealthScreen />;
}
