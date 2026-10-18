import { OwnerNav } from "@/components/owner/owner-nav";
import { requireOwnerSession } from "@/lib/ai/session";
import { getAiPauseState } from "@/lib/ai/pause";

export const metadata = {
  title: "Owner Command Center",
  robots: { index: false, follow: false },
};

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwnerSession();
  const pause = await getAiPauseState();

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted sm:flex-row">
      <OwnerNav aiPaused={pause.globalPaused} simulation={pause.simulationMode} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</main>
    </div>
  );
}
