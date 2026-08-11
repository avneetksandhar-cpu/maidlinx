import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PricingTable } from "@/components/admin/pricing-table";
import { PricingEnginePanel } from "@/components/admin/pricing-engine-panel";
import { listPricingRules } from "@/lib/admin/pricing";
import { getPricingEngineMetrics } from "@/lib/admin/pricing-engine";
import { listAllPricingRules } from "@/lib/pricing/engine/rules";
import { requireAdminPermission } from "@/lib/admin/session";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export const metadata = { title: "Pricing" };

async function PricingContent() {
  await requireAdminPermission("pricing.write");
  const [serviceRules, engineRules, metrics] = await Promise.all([
    listPricingRules(),
    listAllPricingRules(),
    getPricingEngineMetrics(),
  ]);

  let experiments: Array<{
    id: string;
    key: string;
    name: string;
    status: string;
    autoDeployWinner: boolean;
  }> = [];

  if (hasAdminEnv()) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("pricing_experiments")
      .select("id, key, name, status")
      .order("created_at", { ascending: false })
      .limit(50);
    experiments = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        key: String(r.key),
        name: String(r.name),
        status: String(r.status),
        autoDeployWinner: false,
      };
    });
  }

  return (
    <>
      <AdminHeader
        title="Pricing"
        description="Service base rates plus Pricing Engine V1 (dynamic OFF by default)."
      />
      <PricingEnginePanel
        rules={engineRules}
        metrics={metrics}
        experiments={experiments}
      />
      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">
          Service base rates
        </h2>
        <PricingTable rules={serviceRules} />
      </div>
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
