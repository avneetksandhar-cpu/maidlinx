import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import type { ReactNode } from "react";

type AppStubPageProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function AppStubPage({ title, description, children }: AppStubPageProps) {
  return (
    <AppShell showNav>
      <AppHeader title={title} />
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <div
          aria-hidden
          className="mb-6 h-px w-8 bg-accent"
        />
        {description ? (
          <p className="max-w-xs text-sm leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </AppShell>
  );
}
