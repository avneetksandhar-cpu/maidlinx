import Link from "next/link";
import { Container, Eyebrow, Heading, Section, Text, Button } from "@/components/ui";
import { routes } from "@/config/site";

export const metadata = {
  title: "Earn on MaidLinx",
  description:
    "Join MaidLinx as an insured individual cleaner or insured cleaning company subcontractor.",
};

export default function EarnPage() {
  return (
    <Section className="py-12 sm:py-16">
      <Container narrow>
        <Eyebrow>Supply</Eyebrow>
        <Heading as="h1" className="mt-4 font-display text-4xl sm:text-5xl">
          Earn on MaidLinx
        </Heading>
        <Text muted className="mt-4">
          Uber-style jobs for cleaning Pros. Set availability, accept nearby cleans, and get
          paid for completed work — as an insured individual or an insured cleaning company.
        </Text>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-sm font-semibold text-ink">Individual cleaner</p>
            <p className="mt-1 text-sm text-ink-muted">
              Independent subcontractor. Active liability insurance required (attested +
              reviewed by ops).
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-sm font-semibold text-ink">Cleaning company</p>
            <p className="mt-1 text-sm text-ink-muted">
              Join as a company subcontractor. Company insurance required — no fake
              verification; ops reviews your attestation and documents.
            </p>
          </div>
        </div>

        <ul className="mt-8 space-y-3 text-sm text-ink-muted">
          <li className="flex gap-2">
            <span className="text-accent">✓</span>
            Browse and accept confirmed jobs in your area
          </li>
          <li className="flex gap-2">
            <span className="text-accent">✓</span>
            Built-in navigation, checklists, and photo proof
          </li>
          <li className="flex gap-2">
            <span className="text-accent">✓</span>
            Track earnings, ratings, and weekly availability
          </li>
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={`${routes.signUp}?role=cleaner&next=${encodeURIComponent(routes.cleanerApplication)}`}
          >
            <Button variant="primary" size="lg" className="h-12 rounded-lg px-6 font-semibold">
              Apply to clean
            </Button>
          </Link>
          <Link href={routes.cleanerApplication}>
            <Button variant="secondary" size="lg" className="h-12 rounded-lg px-6 font-semibold">
              Continue application
            </Button>
          </Link>
          <Link href={routes.cleanerDashboard}>
            <Button variant="ghost" size="lg" className="h-12 rounded-lg px-6 font-semibold">
              Open cleaner portal
            </Button>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
