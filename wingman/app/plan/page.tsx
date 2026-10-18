import { PlanMyNightScreen } from "@/features/plan/PlanMyNightScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan My Night — Wingman",
};

export default function PlanPage() {
  return <PlanMyNightScreen />;
}
