import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Wingman",
};

export default function PrivacyPage() {
  return (
    <AppShell>
      <AppHeader title="Privacy Policy" showBack backHref="/" />
      <h1 className="text-2xl text-ink">Privacy Policy</h1>
      <p className="mt-2 text-xs text-ink-subtle">Last updated 7 September 2026</p>
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-muted">
        <p>
          Wingman is a Miami nightlife concierge. This policy explains what we collect when you
          create an account, browse nights, request a host, or pay for a night service.
        </p>
        <p>
          We collect the email and name you provide, session cookies used to keep you signed in,
          and details of nights you request or book. Payment card numbers are processed by Stripe
          and are not stored on Wingman servers.
        </p>
        <p>
          We use this information to run your account, complete bookings, send transactional
          messages, and improve the service. We do not sell personal information.
        </p>
        <p>
          You can request access, correction, or deletion of your account data by emailing
          support from the in-app account screen or by writing to the address on our Terms page.
        </p>
        <p>
          This internal beta may change. We will update this page when our practices change.
        </p>
        <p>
          <Link href="/legal/terms" className="text-accent underline-offset-2 hover:underline">
            Terms of Service
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
