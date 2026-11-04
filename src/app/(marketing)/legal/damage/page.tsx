import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading } from "@/components/ui";
import { routes, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Damage Claims Policy",
  description: "MaidLinx damage claims policy placeholder — legal review required.",
  alternates: { canonical: "/legal/damage" },
  robots: { index: false, follow: false },
};

export default function DamageClaimsPolicyPage() {
  return (
    <main id="main-content" className="bg-background">
      <Container className="py-14 sm:py-20">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Legal
        </p>
        <Heading as="h1" className="mt-3 max-w-2xl text-4xl sm:text-5xl">
          Damage Claims Policy
        </Heading>
        <p className="mt-4 max-w-2xl rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
          LEGAL REVIEW REQUIRED — Draft product policy until counsel and Product accept it in
          writing. Insurance and bonding are not guaranteed by this placeholder.
        </p>
        <div className="mt-8 max-w-2xl space-y-4 text-base text-ink-muted">
          <p>
            If property damage occurs during a booked cleaning, report it through Support as soon
            as practicable and include the booking reference, photos, and a description of what
            happened. MaidLinx may facilitate review between the customer and the independent
            cleaner; outcomes depend on facts, market rules, and any applicable coverage.
          </p>
          <p>
            Contact:{" "}
            <a className="underline underline-offset-2" href={siteConfig.links.support}>
              support
            </a>
            .
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-2">
            <Link className="underline underline-offset-2" href={routes.legal.terms}>
              Terms of Service
            </Link>
            <Link className="underline underline-offset-2" href={routes.legal.privacy}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}
