import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading, Button } from "@/components/ui";
import { routes, siteConfig } from "@/config/site";
import { getActiveMarkets } from "@/config/markets";

export const metadata: Metadata = {
  title: "About",
  description:
    "MaidLinx is an on-demand cleaning marketplace for homes in Toronto / GTA and South Florida.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const markets = getActiveMarkets()
    .map((m) => m.name)
    .join(" and ");

  return (
    <main id="main-content" className="bg-background">
      <Container className="py-12 sm:py-16">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">About</p>
        <Heading as="h1" className="mt-3 max-w-2xl font-display text-4xl sm:text-5xl">
          Come home to clean.
        </Heading>
        <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-ink-muted">
          <p>
            {siteConfig.name} is an Uber-style cleaning marketplace. Customers book home cleaning
            online — address, service, schedule, upfront price — and Pros complete the job.
          </p>
          <p>
            We currently configure service for {markets}. We do not claim coverage outside those
            markets. Booking availability depends on market flags and local supply.
          </p>
          <p>
            Pros join through onboarding with screening gates and insurance attestation; ops reviews
            applications. Customer payments run through Stripe (LIVE stays off until founder
            approval). Published cancellation, refund, and damage policies are product drafts
            pending legal review.
          </p>
          <p>
            Workplace and commercial cleaning is a separate path from residential booking — see{" "}
            <Link href={routes.forBusiness} className="font-medium text-ink underline-offset-2 hover:underline">
              For business
            </Link>
            .
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={routes.book}>
            <Button variant="primary" size="lg" className="h-12 rounded-lg px-6 font-semibold">
              Check availability
            </Button>
          </Link>
          <Link href={routes.becomeCleaner}>
            <Button variant="secondary" size="lg" className="h-12 rounded-lg px-6 font-semibold">
              Earn with MaidLinx
            </Button>
          </Link>
        </div>
        <p className="mt-8 text-sm text-ink-subtle">
          Questions:{" "}
          <a className="underline underline-offset-2" href={siteConfig.links.support}>
            {siteConfig.email}
          </a>
        </p>
      </Container>
    </main>
  );
}
