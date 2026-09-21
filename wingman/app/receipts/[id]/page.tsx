import { ReceiptScreen } from "@/features/profile/components/ReceiptScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Receipt — Wingman",
};

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReceiptScreen id={id} />;
}
