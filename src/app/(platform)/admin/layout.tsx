import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdminSession } from "@/lib/admin/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div
      data-theme="ml-dark"
      className="flex min-h-dvh bg-[var(--ml-dark-bg)] text-[var(--ml-dark-ink)]"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <AdminNav />
      <main className="min-w-0 flex-1 pb-8">{children}</main>
    </div>
  );
}
