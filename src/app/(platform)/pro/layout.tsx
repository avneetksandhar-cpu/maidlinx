import { ProNav } from "@/components/pro/pro-nav";

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-muted">
      <ProNav />
      <main className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</main>
    </div>
  );
}
