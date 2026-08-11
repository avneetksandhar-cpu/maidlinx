import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { CouponsPanel } from "@/components/admin/coupons-panel";
import { listCoupons } from "@/lib/admin/coupons";
import { requireAdminPermission } from "@/lib/admin/session";

export const metadata = { title: "Coupons" };

async function CouponsContent() {
  await requireAdminPermission("coupons.write");
  const coupons = await listCoupons();

  return (
    <>
      <AdminHeader title="Coupons" description="Create and manage promotional discount codes." />
      <CouponsPanel coupons={coupons} />
    </>
  );
}

export default function AdminCouponsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <CouponsContent />
      </Suspense>
    </div>
  );
}
