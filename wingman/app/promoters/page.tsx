import { PromotersScreen } from "@/features/promoters/components/PromotersScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promoters — Wingman",
};

export default function PromotersPage() {
  return <PromotersScreen />;
}
