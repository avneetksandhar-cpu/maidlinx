import { ScreenLayout } from "@/components/layout/ScreenLayout";
import type { ReactNode } from "react";

type StubPageProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function StubPage({ title, description, children }: StubPageProps) {
  return (
    <ScreenLayout className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.35em] text-ink-subtle">
        Wingman
      </p>
      <h1 className="mt-6 text-2xl font-light text-ink">{title}</h1>
      {description ? (
        <p className="mt-3 max-w-xs text-sm text-ink-muted">{description}</p>
      ) : null}
      {children}
    </ScreenLayout>
  );
}
