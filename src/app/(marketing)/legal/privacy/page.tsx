import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading } from "@/components/ui";
import { routes, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How MaidLinx collects and uses account, address, payment, and service data. Legal review still required.",
  alternates: { canonical: "/legal/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <main id="main-content" className="bg-background">
      <Container className="py-14 sm:py-20">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Legal
        </p>
        <Heading as="h1" className="mt-3 max-w-2xl text-4xl sm:text-5xl">
          Privacy Policy
        </Heading>
        <p className="mt-2 text-sm text-ink-muted">Last updated: October 19, 2026</p>
        <p className="mt-4 max-w-2xl rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
          LEGAL REVIEW REQUIRED — This describes what the product actually collects today. It is
          not final counsel-approved privacy terms. Counsel should replace this with a complete
          policy before relying on it as legal advice.
        </p>

        <div className="mt-8 max-w-2xl space-y-8 text-base text-ink-muted">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Who we are</h2>
            <p>
              MaidLinx (“we”) operates a cleaning marketplace at {siteConfig.url}. Contact:{" "}
              <a className="underline underline-offset-2" href={siteConfig.links.support}>
                {siteConfig.email}
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Account &amp; authentication</h2>
            <p>
              When you create an account we collect email address, password (stored by our auth
              provider, not in plain text on MaidLinx servers), and optional name and phone. You
              may also sign in with Google or Apple OAuth. We use Supabase Auth for sessions and
              identity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Addresses &amp; location</h2>
            <p>
              To schedule a clean we collect service addresses (street, unit, city, region, postal
              code, country). You may enter an address manually, search with Google Places when
              enabled, or use device location to reverse-geocode a street address. Precise GPS is
              used only to help fill the address form or, for cleaners, to share live job status
              while en route or on site when that feature is enabled. Live cleaner location is
              current-point only and is cleared when the job leaves en-route / arrived status.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Payments</h2>
            <p>
              Deposits and payments are processed by Stripe. We do not store full card numbers on
              MaidLinx servers. We retain payment references (such as Stripe customer or payment
              intent IDs), amounts, and booking status needed for receipts, refunds, disputes, and
              financial audit. Stripe LIVE charges stay disabled until Product enables them.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Photos &amp; documents</h2>
            <p>
              Cleaners may upload before/after job photos and identity or work documents (for
              example ID images or insurance metadata) for ops review. Customer profile photos may
              come from OAuth providers when you connect them. Job and identity media are used for
              service quality and trust review, not for advertising.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Communications &amp; analytics</h2>
            <p>
              We send transactional email (and SMS when configured) about bookings, account
              security, and support. We may store privacy-safe product analytics (for example
              funnel steps and device category). Session replay is not enabled for launch privacy.
              Error monitoring (Sentry) may receive technical diagnostics without Session Replay.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Account deletion</h2>
            <p>
              You can request in-app account deletion from{" "}
              <Link className="underline underline-offset-2" href={routes.dashboardAccountDelete}>
                Profile → Delete account
              </Link>{" "}
              (customers) or{" "}
              <Link className="underline underline-offset-2" href={routes.cleanerAccountDelete}>
                Settings → Delete account
              </Link>{" "}
              (cleaners). We anonymize personal profile fields and disable sign-in. Booking and
              payment records needed for receipts, refunds, and audit are retained in anonymized or
              operational form and are not destroyed in a way that breaks payment integrity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Your choices</h2>
            <p>
              You can update profile details in the app, reset your password from sign-in, and
              contact support for privacy questions. For App Store / privacy questionnaire
              purposes, categories in use include: contact info, identifiers, location (precise /
              coarse as applicable to booking and live job tracking), user content (addresses,
              messages/support, photos), and payment info processed by Stripe.
            </p>
          </section>

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
