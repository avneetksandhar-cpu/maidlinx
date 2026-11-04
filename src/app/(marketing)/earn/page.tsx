import Link from "next/link";
import Image from "next/image";
import { Container, Eyebrow, Heading, Section, Text, Button } from "@/components/ui";
import { routes, siteConfig } from "@/config/site";

export const metadata = {
  title: "Earn on MaidLinx",
  description:
    "Join MaidLinx as an insured individual cleaner or insured cleaning company subcontractor.",
};

export default function EarnPage() {
  return (
    <div data-theme="ml-dark" className="min-h-dvh bg-[var(--ml-dark-bg)] text-[var(--ml-dark-ink)]">
      <Section className="py-12 sm:py-16">
        <Container narrow>
          <Image
            src="/brand/maidlinx-logo.png"
            alt={siteConfig.name}
            width={170}
            height={84}
            className="mb-8 h-10 w-auto object-contain sm:h-12"
            priority
          />
          <Eyebrow className="text-[var(--ml-dark-mint)]">Supply</Eyebrow>
          <Heading as="h1" className="mt-4 font-display text-4xl text-[var(--ml-dark-ink)] sm:text-5xl">
            Earn on MaidLinx
          </Heading>
          <Text muted className="mt-4 text-[var(--ml-dark-ink-muted)]">
            Uber-style jobs for cleaning Pros. Apply, create your account, finish onboarding
            (profile, insurance, docs), wait for ops review — then access jobs when approved.
          </Text>

          <ol className="mt-8 space-y-3 text-sm text-[var(--ml-dark-ink-muted)]">
            <li className="flex gap-3">
              <span className="font-semibold text-[var(--ml-dark-mint)]">1</span>
              Apply / create account
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-[var(--ml-dark-mint)]">2</span>
              Onboarding — profile, insurance attestation, documents, vehicle
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-[var(--ml-dark-mint)]">3</span>
              Pending review by ops (no auto-approval)
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-[var(--ml-dark-mint)]">4</span>
              Approved access to cleaner portal jobs
            </li>
          </ol>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-4">
              <p className="text-sm font-semibold text-[var(--ml-dark-ink)]">Individual cleaner</p>
              <p className="mt-1 text-sm text-[var(--ml-dark-ink-muted)]">
                Independent subcontractor. Active liability insurance required (attested +
                reviewed by ops).
              </p>
            </div>
            <div className="rounded-xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-4">
              <p className="text-sm font-semibold text-[var(--ml-dark-ink)]">Cleaning company</p>
              <p className="mt-1 text-sm text-[var(--ml-dark-ink-muted)]">
                Join as a company subcontractor. Company insurance required — ops reviews your
                attestation and documents.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={`${routes.signUp}?role=cleaner&next=${encodeURIComponent(routes.cleanerApplication)}`}
            >
              <Button variant="primary" size="lg" className="h-12 rounded-lg px-6 font-semibold">
                Apply to clean
              </Button>
            </Link>
            <Link
              href={`${routes.signIn}?role=cleaner&next=${encodeURIComponent(routes.cleanerApplication)}`}
            >
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
    </div>
  );
}
