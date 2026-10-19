import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { OwnerCleanerOpsForm } from "@/components/owner/owner-cleaner-ops-form";
import { routes } from "@/config/site";
import { requireAdminPermission } from "@/lib/admin/session";
import { loadOwnerCleanerOps } from "@/lib/owner/cleaner-ops";

export const metadata = { title: "Owner · Cleaner ops" };

export default async function OwnerCleanerOpsPage({
  params,
}: {
  params: Promise<{ cleanerId: string }>;
}) {
  await requireAdminPermission("cleaners.write");
  const { cleanerId } = await params;
  const snap = await loadOwnerCleanerOps(cleanerId);
  if (!snap) notFound();

  return (
    <>
      <AdminHeader
        title={`Cleaner ops · ${snap.displayName}`}
        description="Enter REAL market, zones, services, availability. Do not invent data."
        badge="Ops"
      />

      <p className="mb-4 text-sm">
        <Link href={routes.ownerCleaners} className="underline text-ink">
          ← Cleaner capacity
        </Link>
        {" · "}
        <Link href={routes.adminCleaners} className="underline text-ink">
          Admin approve/activate
        </Link>
      </p>

      <dl className="mb-6 grid gap-3 grid-cols-2 lg:grid-cols-4 text-sm">
        <div className="rounded-xl border border-border bg-surface p-3">
          <dt className="text-ink-muted">Cleaner ID</dt>
          <dd className="mt-1 font-mono text-xs text-ink">{snap.cleanerId}</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <dt className="text-ink-muted">Approval</dt>
          <dd className="mt-1 text-ink">
            {snap.approved ? "approved" : "not approved"} ·{" "}
            {snap.active ? "active" : "inactive"}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <dt className="text-ink-muted">Onboarding</dt>
          <dd className="mt-1 text-ink">{snap.onboardingStatus}</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <dt className="text-ink-muted">Online</dt>
          <dd className="mt-1 text-ink">{snap.isOnline ? "yes" : "no"}</dd>
        </div>
      </dl>

      <OwnerCleanerOpsForm initial={snap} />
    </>
  );
}
