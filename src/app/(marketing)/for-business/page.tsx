import Link from "next/link";
import { Container, Heading, Button } from "@/components/ui";
import { BusinessLeadForm } from "@/components/marketing/business-lead-form";
import { routes } from "@/config/site";

export const metadata = {
  title: "Business Cleaning",
  description:
    "Check commercial cleaning availability for South Florida offices and storefronts — request a quote when a crew isn’t listed yet.",
};

export default function ForBusinessPage() {
  return (
    <main id="main-content" className="bg-background">
      <Container className="py-12 sm:py-16">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          For business
        </p>
        <Heading as="h1" className="mt-3 max-w-xl text-4xl font-bold sm:text-5xl">
          Commercial cleaning for South Florida workplaces.
        </Heading>
        <p className="mt-4 max-w-lg text-base font-normal text-ink-muted sm:text-lg">
          Start with availability for your office, storefront, or managed property.
          Request a quote only if you need multi-site coverage or no crew is listed
          yet.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={routes.home}>
            <Button variant="primary" size="lg" className="h-12 rounded-lg px-6 font-semibold">
              Check availability
            </Button>
          </Link>
          <Link href="#quote">
            <Button variant="secondary" size="lg" className="h-12 rounded-lg px-6 font-semibold">
              Request a quote
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-sm text-ink-muted">
          Looking for home cleaning?{" "}
          <Link href={routes.bookWelcome} className="font-medium text-ink underline-offset-2 hover:underline">
            Come home to clean
          </Link>
        </p>

        <div id="quote" className="scroll-mt-24">
          <BusinessLeadForm />
        </div>
      </Container>
    </main>
  );
}
