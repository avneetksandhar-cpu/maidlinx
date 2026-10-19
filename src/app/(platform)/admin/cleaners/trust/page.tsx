import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { CleanerTrustCenter } from "@/components/admin/cleaner-trust-center";
import { requireAdminPermission } from "@/lib/admin/session";

export const metadata = { title: "Cleaner Trust Center" };

async function Content() {
  await requireAdminPermission("cleaners.read");
  return (
    <>
      <AdminHeader
        title="Cleaner Trust Center"
        description="Identity, screening, gates, activation, and audit. Never auto-approve while providers are pending."
      />
      <CleanerTrustCenter />
    </>
  );
}

export default function AdminCleanerTrustPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <Content />
      </Suspense>
    </div>
  );
}
