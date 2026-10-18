import { NightPassScreen } from "@/features/pass/NightPassScreen";

export default async function PassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NightPassScreen id={id} />;
}
