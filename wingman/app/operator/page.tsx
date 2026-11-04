import { OperatorDashboard } from "@/features/operator/components/OperatorDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Operator — Wingman" };

export default function OperatorPage() {
  return <OperatorDashboard />;
}
