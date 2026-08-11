import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";
import { routes } from "@/config/site";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center">
      <SiteLogo className="mb-8" priority />
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Page not found</h1>
      <p className="mt-3 max-w-md text-base text-ink-muted">
        That page doesn’t exist or has moved. Book cleaning from the homepage, or explore
        business cleaning and joining as a pro.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={routes.home}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          Go home
        </Link>
        <Link
          href={routes.forBusiness}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-ink hover:bg-surface-muted"
        >
          Business cleaning
        </Link>
      </div>
    </main>
  );
}
