import { WingmanWordmark } from "@/components/brand/WingmanLogo";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/auth/server";
import type { UserRole } from "@/lib/auth/types";
import Link from "next/link";
import { redirect } from "next/navigation";

const copy: Record<UserRole, { title: string; description: string }> = {
  member: {
    title: "Customer",
    description: "Customer workspace. Guest-list access is an entitlement flag, not a role.",
  },
  partner: {
    title: "Wingman",
    description:
      "Wingman desk. Unverified applicants never appear publicly. Seed partner login is a local account, not a published Wingman.",
  },
  admin: {
    title: "Operator",
    description: "Operator desk for inventory, verification, routing, and support.",
  },
  owner: {
    title: "Admin",
    description: "Product admin. Fee configuration and full operator access.",
  },
};

export async function RoleDashboard({
  allowed,
  heading,
}: {
  allowed: UserRole[];
  heading: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }
  if (!allowed.includes(user.role)) {
    redirect("/forbidden");
  }

  const roleCopy = copy[user.role];

  return (
    <AppShell>
      <AppHeader title={heading} showBack backHref="/home" />
      <WingmanWordmark logoSize={22} className="mb-6" />
      <p className="text-[11px] uppercase tracking-[0.22em] text-accent">{roleCopy.title}</p>
      <h1 className="mt-3 text-2xl font-semibold text-ink">{heading}</h1>
      <p className="mt-3 text-sm text-ink-muted">{roleCopy.description}</p>

      <dl className="mt-6 space-y-3 rounded-2xl border border-border bg-surface p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-subtle">Email</dt>
          <dd className="text-ink">{user.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-subtle">Role</dt>
          <dd className="text-ink">{user.role}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-subtle">Membership tier</dt>
          <dd className="text-ink">{user.membershipTier}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-subtle">Approval</dt>
          <dd className="text-ink">{user.approvalStatus}</dd>
        </div>
      </dl>

      <Link href="/profile" className="mt-6 block text-sm text-accent underline-offset-2 hover:underline">
        Profile
      </Link>
    </AppShell>
  );
}
