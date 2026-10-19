import Link from "next/link";
import { Container, Heading, Button } from "@/components/ui";
import { BusinessLeadForm } from "@/components/marketing/business-lead-form";
import { routes } from "@/config/site";

export const metadata = {
  title: "Business Cleaning",
  description:
    "Office, retail, restaurant, and commercial cleaning estimates for MaidLinx — separate from residential booking.",
};

export default function ForBusinessPage() {
  return (
    <main id="main-content" className="bg-background">
      <Container className="py-12 sm:py-16">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          For business
        </p>
        <Heading as="h1" className="mt-3 max-w-xl font-display text-4xl sm:text-5xl">
          Workplace cleaning — not the home booking path.
        </Heading>
        <p className="mt-4 max-w-lg text-base text-ink-muted sm:text-lg">
          Residential cleans start on the home flow with address and upfront pricing. Businesses use
          this page for a sales follow-up estimate, or book an office clean online when your market
          is open.
        </p>

        <div className="mt-8 grid gap-6 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-ink">Who this is for</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
              <li>Offices and coworking spaces</li>
              <li>Retail storefronts</li>
              <li>Restaurants and venues</li>
              <li>Property managers and short-term rental operators</li>
              <li>Other commercial spaces needing recurring or one-time cleans</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">What we need for an estimate</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
              <li>Company name and work email</li>
              <li>Contact name and phone (optional but helpful)</li>
              <li>Segment (office, retail, restaurant, commercial, etc.)</li>
              <li>Location / market notes and what you need cleaned</li>
              <li>Website (optional — used only for context, not marketing spam)</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`${routes.book}?service=office`}>
            <Button variant="primary" size="lg" className="h-12 rounded-lg px-6 font-semibold">
              Book office clean online
            </Button>
          </Link>
          <Link href={routes.home}>
            <Button variant="secondary" size="lg" className="h-12 rounded-lg px-6 font-semibold">
              Home cleaning instead
            </Button>
          </Link>
        </div>

        <BusinessLeadForm />
      </Container>
    </main>
  );
}
