import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PricingTable } from "@/components/admin/pricing-table";
import { listPricingRules } from "@/lib/admin/pricing";
import { requireAdminPermission } from "@/lib/admin/session";

export const metadata = { title: "Pricing" };

async function PricingContent() {
  await requireAdminPermission("pricing.write");
  const rules = await listPricingRules();

  return (
    <>
      <AdminHeader title="Pricing" description="Configure base rates, add-ons, and platform fee per service type." />
      <PricingTable rules={rules} />
    </>
  );
}

export default function AdminPricingPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <PricingContent />
      </Suspense>
    </div>
  );
}
