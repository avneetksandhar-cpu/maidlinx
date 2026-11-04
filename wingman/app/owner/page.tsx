import { RoleDashboard } from "@/components/auth/RoleDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner — Wingman",
};

export default function OwnerPage() {
  return <RoleDashboard allowed={["owner"]} heading="Owner" />;
}
