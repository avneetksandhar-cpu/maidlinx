import { PromoterProfileLoader } from "@/features/promoters";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Promoter — Wingman" };
}

export default async function PromoterDetailPage({ params }: Props) {
  const { id } = await params;
  return <PromoterProfileLoader id={id} />;
}
