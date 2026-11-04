import { OperatorDashboard } from "@/features/operator/components/OperatorDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin — Wingman",
};

export default function AdminPage() {
  return <OperatorDashboard />;
}
