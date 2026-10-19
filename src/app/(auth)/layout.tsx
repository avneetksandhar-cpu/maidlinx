import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Auth surfaces share the premium dark iOS shell used by booking + cleaner portal.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-theme="ml-dark"
      className="min-h-dvh bg-[var(--ml-dark-bg)] text-[var(--ml-dark-ink)]"
    >
      {children}
    </div>
  );
}
