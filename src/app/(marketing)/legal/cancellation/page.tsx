import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading } from "@/components/ui";
import { routes, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Cancellation Policy",
  description: "MaidLinx cancellation policy placeholder — legal review required.",
  alternates: { canonical: "/legal/cancellation" },
  robots: { index: false, follow: false },
};

export default function CancellationPolicyPage() {
  return (
    <main id="main-content" className="bg-background">
      <Container className="py-14 sm:py-20">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Legal
        </p>
        <Heading as="h1" className="mt-3 max-w-2xl text-4xl sm:text-5xl">
          Cancellation Policy
        </Heading>
        <p className="mt-4 max-w-2xl rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
          LEGAL REVIEW REQUIRED — Draft product policy until counsel and Product accept it in
          writing.
        </p>
        <div className="mt-8 max-w-2xl space-y-4 text-base text-ink-muted">
          <p>
            Customer-initiated cancellations at least 24 hours before the scheduled start may
            qualify for a full deposit refund when processed through Stripe. Cancellations inside
            24 hours may be non-refundable or require admin review.
          </p>
          <p>
            Request cancellations from your booking dashboard or by contacting{" "}
            <a className="underline underline-offset-2" href={siteConfig.links.support}>
              support
            </a>
            .
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-2">
            <Link className="underline underline-offset-2" href={routes.legal.refund}>
              Refund Policy
            </Link>
            <Link className="underline underline-offset-2" href={routes.legal.terms}>
              Terms of Service
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}
