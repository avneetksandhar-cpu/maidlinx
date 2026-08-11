import Link from "next/link";
import { Container, Eyebrow, Heading, Section, Text } from "@/components/ui";
import { routes } from "@/config/site";

export default function EarnPage() {
  return (
    <Section className="py-16">
      <Container narrow>
        <Eyebrow>Supply</Eyebrow>
        <Heading as="h1" className="mt-4">
          Earn on MaidLinx
        </Heading>
        <Text muted className="mt-4">
          Join a premium cleaning marketplace. Set your availability, accept jobs on your schedule,
          and get paid for every completed clean.
        </Text>

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
            Track earnings, ratings, and your weekly availability
          </li>
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={`${routes.signUp}?role=cleaner&next=${encodeURIComponent(routes.cleanerDashboard)}`}
            className="inline-flex h-12 items-center justify-center rounded-md bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Apply to clean
          </Link>
          <Link
            href={routes.cleanerDashboard}
            className="inline-flex h-12 items-center justify-center rounded-md border border-border-strong bg-surface px-6 text-sm font-medium text-ink transition-colors hover:bg-accent-muted"
          >
            Open cleaner portal
          </Link>
        </div>
      </Container>
    </Section>
  );
}
