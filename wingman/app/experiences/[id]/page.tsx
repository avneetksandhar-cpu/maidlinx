import { StubPage } from "@/components/layout/StubPage";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Experience ${id} — Wingman` };
}

export default async function ExperienceDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <StubPage
      title={`Experience ${id}`}
      description="Experience details and booking. Coming soon."
    />
  );
}
