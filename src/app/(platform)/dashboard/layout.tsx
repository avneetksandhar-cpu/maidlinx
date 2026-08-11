import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-muted">
      <DashboardNav />
      <main className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</main>
    </div>
  );
}
