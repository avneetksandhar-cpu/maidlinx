import { OwnerNav } from "@/components/owner/owner-nav";
import { requireOwnerSession } from "@/lib/ai/session";

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

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted sm:flex-row">
      <OwnerNav />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
    </div>
  );
}
