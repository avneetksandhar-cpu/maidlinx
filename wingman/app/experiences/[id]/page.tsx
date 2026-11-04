import { CatalogExperienceScreen } from "@/features/experiences/components/CatalogExperienceScreen";
import { EXPERIENCE_SLUGS } from "@/lib/catalog/types";
import type { Metadata } from "next";
import { Suspense } from "react";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `${id[0]?.toUpperCase()}${id.slice(1)} — Wingman` };
}

export default async function ExperienceDetailPage({ params }: Props) {
  const { id } = await params;
  const slug = EXPERIENCE_SLUGS.includes(id as (typeof EXPERIENCE_SLUGS)[number]) ? id : id;
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <CatalogExperienceScreen slug={slug} />
    </Suspense>
  );
}
