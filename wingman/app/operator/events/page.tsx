import { EventOpsScreen } from "@/features/operator/components/EventOpsScreen";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Event ops — Wingman" };

export default function OperatorEventsPage() {
  return <EventOpsScreen />;
}
