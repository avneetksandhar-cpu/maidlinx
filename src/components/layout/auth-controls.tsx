"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { routes } from "@/config/site";

export function AuthControls() {
  return (
    <>
      <Link
        href={routes.signIn}
        className="px-2 text-sm font-medium text-ink-muted transition-colors duration-200 hover:text-ink"
      >
        Log in
      </Link>
      <Link href={routes.book}>
        <Button
          variant="accent"
          size="sm"
          className="h-9 rounded-lg px-4 text-sm font-semibold"
        >
          Get started
        </Button>
      </Link>
    </>
  );
}
