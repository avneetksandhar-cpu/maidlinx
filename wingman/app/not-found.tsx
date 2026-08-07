import { ScreenLayout } from "@/components/layout/ScreenLayout";
import Link from "next/link";

export default function NotFound() {
  return (
    <ScreenLayout className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.35em] text-ink-subtle">
        404
      </p>
      <h1 className="mt-6 text-2xl font-light text-ink">Page not found</h1>
      <p className="mt-3 text-sm text-ink-muted">
        This experience isn&apos;t available.
      </p>
      <Link
        href="/"
        className="mt-8 text-sm text-accent underline-offset-2 hover:underline"
      >
        Return home
      </Link>
    </ScreenLayout>
  );
}
