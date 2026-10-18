"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { routes } from "@/config/site";

export function AuthControls() {
  return (
    <>
      <Link
        href={routes.signIn}
        className="inline-flex h-10 items-center justify-center rounded-[12px] border border-accent/30 bg-white px-4 text-sm font-semibold text-accent transition-colors hover:border-accent hover:bg-accent-muted"
      >
        Log in
      </Link>
      <Link href={routes.book}>
        <Button variant="primary" size="sm" className="h-10 rounded-[12px] px-4 text-sm font-semibold">
          Get started
        </Button>
      </Link>
    </>
  );
}
