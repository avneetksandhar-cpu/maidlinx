"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { routes } from "@/config/site";

export function AuthControls() {
  return (
    <>
      <Link
        href={routes.signIn}
        className="inline-flex h-10 items-center justify-center rounded-[12px] border border-[var(--maidlinx-border)] bg-white px-4 text-sm font-semibold text-[var(--maidlinx-text)] transition-colors hover:border-[var(--maidlinx-green)]/40 hover:text-[var(--maidlinx-green)]"
      >
        Log in
      </Link>
      <Link href={routes.book}>
        <Button
          variant="accent"
          size="sm"
          className="h-10 rounded-[12px] bg-[var(--maidlinx-green)] px-4 text-sm font-semibold hover:bg-[var(--maidlinx-green-dark)]"
        >
          Get started
        </Button>
      </Link>
    </>
  );
}
