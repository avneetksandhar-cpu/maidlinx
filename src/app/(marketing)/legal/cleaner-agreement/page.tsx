import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading } from "@/components/ui";
import { routes, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Cleaner Agreement",
  description: "MaidLinx cleaner agreement placeholder — legal review required.",
  alternates: { canonical: "/legal/cleaner-agreement" },
  robots: { index: false, follow: false },
};

export default function CleanerAgreementPage() {
  return (
    <main id="main-content" className="bg-background">
      <Container className="py-14 sm:py-20">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Legal
        </p>
        <Heading as="h1" className="mt-3 max-w-2xl text-4xl sm:text-5xl">
          Cleaner Agreement
        </Heading>
        <p className="mt-4 max-w-2xl rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
          LEGAL REVIEW REQUIRED — Placeholder only. Independent-contractor classification, payout
          timing, and liability terms need counsel review before production cleaner onboarding at
          scale.
        </p>
        <div className="mt-8 max-w-2xl space-y-4 text-base text-ink-muted">
          <p>
            Cleaners using MaidLinx tools acknowledge they may receive job offers, update job
            status, and share location only while a job is active as required for customer
            tracking. Payouts may be recorded in-app; automatic Stripe Connect transfers stay
            disabled unless explicitly enabled by operators.
          </p>
          <p>
            Contact:{" "}
            <a className="underline underline-offset-2" href={siteConfig.links.support}>
              support
            </a>
            .
          </p>
          <p>
            <Link className="underline underline-offset-2" href={routes.legal.terms}>
              Terms of Service
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}
