import { AppShell } from "@/components/layout/AppShell";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Access denied — Wingman",
};

export default function ForbiddenPage() {
  return (
    <AppShell className="justify-center text-center">
      <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Restricted</p>
      <h1 className="mt-4 text-2xl font-bold text-ink">You don’t have access</h1>
      <p className="mt-3 text-sm text-ink-muted">
        This area is limited to the roles allowed for this route.
      </p>
      <Link href="/home" className="mt-8 text-sm text-accent underline-offset-2 hover:underline">
        Return home
      </Link>
    </AppShell>
  );
}
