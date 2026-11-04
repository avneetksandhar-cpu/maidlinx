import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading } from "@/components/ui";
import { routes, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "MaidLinx terms of service placeholder — legal review required.",
  alternates: { canonical: "/legal/terms" },
  robots: { index: false, follow: false },
};

export default function TermsOfServicePage() {
  return (
    <main id="main-content" className="bg-background">
      <Container className="py-14 sm:py-20">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Legal
        </p>
        <Heading as="h1" className="mt-3 max-w-2xl text-4xl sm:text-5xl">
          Terms of Service
        </Heading>
        <p className="mt-4 max-w-2xl rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
          LEGAL REVIEW REQUIRED — This page is a launch placeholder, not final counsel-approved
          terms. Cancellation and refund rules below are draft product policy until Product
          accepts them in writing.
        </p>
        <div className="mt-8 max-w-2xl space-y-4 text-base text-ink-muted">
          <p>
            MaidLinx is a marketplace that connects customers with independent cleaning
            professionals. Booking estimates shown in the app are subject to server-side price
            confirmation. A deposit may be charged at checkout; remaining balance settlement is
            handled per the confirmation and support process for your booking.
          </p>
          <p>
            <strong className="font-medium text-ink">Draft cancellation / refund policy (unapproved):</strong>{" "}
            customer-initiated cancellations at least 24 hours before the scheduled start may
            qualify for a full deposit refund when processed through Stripe; cancellations inside
            24 hours may be non-refundable or require admin review. BUSINESS DECISION REQUIRED
            before relying on this for real-money customers.
          </p>
          <p>
            Background checks, insurance, and bonding are not guaranteed by these placeholder
            terms unless separately confirmed in writing for a specific market or cleaner.
          </p>
          <p>
            Questions:{" "}
            <a className="underline underline-offset-2" href={siteConfig.links.support}>
              support
            </a>
            .
          </p>
          <p>
            <Link className="underline underline-offset-2" href={routes.legal.privacy}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}
