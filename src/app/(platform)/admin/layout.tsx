import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdminSession } from "@/lib/admin/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <AdminNav />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
