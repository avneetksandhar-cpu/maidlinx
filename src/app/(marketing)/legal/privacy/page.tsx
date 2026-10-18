import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading } from "@/components/ui";
import { routes, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "MaidLinx privacy policy placeholder — legal review required.",
  alternates: { canonical: "/legal/privacy" },
  robots: { index: false, follow: false },
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
        <p className="mt-4 max-w-2xl rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
          LEGAL REVIEW REQUIRED — This page is a launch placeholder, not final counsel-approved
          privacy terms. Do not treat it as the complete privacy policy.
        </p>
        <div className="mt-8 max-w-2xl space-y-4 text-base text-ink-muted">
          <p>
            MaidLinx (“we”) collects account, booking, address, and payment-related information
            needed to schedule cleaning services and process deposits through Stripe. We use
            Supabase for authentication and data storage, Google Maps for address lookup when
            enabled, and email/SMS providers when configured for transactional notices.
          </p>
          <p>
            We do not store full card numbers on MaidLinx servers. Payment card data is handled by
            Stripe. Location data may be used for service-area eligibility and, when a cleaner is
            en route or on site, for live job status where that feature is enabled.
          </p>
          <p>
            Contact for privacy questions:{" "}
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
