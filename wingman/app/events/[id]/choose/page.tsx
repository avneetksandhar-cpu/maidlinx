import { ChooseExperienceScreen } from "@/features/events/components/ChooseExperienceScreen";

export default async function ChooseExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChooseExperienceScreen id={id} />;
}
