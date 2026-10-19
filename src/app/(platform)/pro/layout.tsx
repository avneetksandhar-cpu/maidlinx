import { ProNav } from "@/components/pro/pro-nav";

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="ml-dark"
      className="flex min-h-dvh bg-[var(--ml-dark-bg)] text-[var(--ml-dark-ink)]"
    >
      <ProNav />
      <main className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</main>
    </div>
  );
}
