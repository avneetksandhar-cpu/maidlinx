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
        <Heading as="h1" className="mt-3 max-w-xl text-4xl font-bold sm:text-5xl">
          Commercial cleaning for South Florida sites.
        </Heading>
        <p className="mt-4 max-w-lg text-base font-normal text-ink-muted sm:text-lg">
          Primary path: select a site → define scope → book when priced, or request quotes. Home
          cleaning remains available as a secondary residential flow.
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
          <Link href={routes.dashboardSites}>
            <Button variant="primary" size="lg" className="h-12 rounded-lg px-6 font-semibold">
              Open Sites
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
