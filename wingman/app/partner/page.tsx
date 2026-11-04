import { WingmanInbox } from "@/features/wingman/WingmanInbox";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wingman desk — Wingman",
};

export default function PartnerPage() {
  return <WingmanInbox />;
}
