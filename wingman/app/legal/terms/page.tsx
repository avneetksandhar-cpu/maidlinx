import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Wingman",
};

export default function TermsPage() {
  return (
    <AppShell>
      <AppHeader title="Terms" showBack backHref="/" />
      <h1 className="text-2xl text-ink">Terms of Service</h1>
      <p className="mt-2 text-xs text-ink-subtle">Last updated 7 September 2026</p>
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-muted">
        <p>Wingman is for adults 18 and over. You must provide accurate account information.</p>
        <p>
          A request is not a reservation. Nothing is held at a venue until a night is confirmed
          and paid. Wingman does not sell admission, guest lists, or tables.
        </p>
        <p>
          The $500 night service is a host-guided evening, not a guarantee of entry, a specific
          table, crowd, or access to specific people. Romantic or sexual companionship is not
          offered.
        </p>
        <p>
          Payments are processed securely by Stripe. Unpaid requests can be cancelled from the
          night detail. After payment, refunds are handled by an operator.
        </p>
        <p>
          Discovery listings come from public venue calendars. A listing is not a partnership
          with that venue.
        </p>
        <p>
          These terms apply to the Wingman app and website. Contact support from your account if
          something goes wrong during a night.
        </p>
        <p>
          <Link href="/legal/privacy" className="text-accent underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
