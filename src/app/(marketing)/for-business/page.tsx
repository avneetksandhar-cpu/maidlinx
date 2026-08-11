import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading, Button } from "@/components/ui";
import { routes } from "@/config/site";

export const metadata: Metadata = {
  title: "Business Cleaning",
  description:
    "Book office, retail, restaurant, and commercial cleaning on demand with MaidLinx in Toronto/GTA and South Florida.",
  alternates: { canonical: "/for-business" },
  openGraph: {
    title: "Business Cleaning | MaidLinx",
    description:
      "Book office, retail, restaurant, and commercial cleaning on demand with MaidLinx in Toronto/GTA and South Florida.",
  },
};

export default function ForBusinessPage() {
  return (
    <main id="main-content" className="bg-background">
      <Container className="py-14 sm:py-20">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          Business
        </p>
        <Heading as="h1" className="mt-3 max-w-xl text-4xl sm:text-5xl">
          Cleaning for workplaces.
        </Heading>
        <p className="mt-4 max-w-lg text-base text-ink-muted sm:text-lg">
          Offices, retail, restaurants, and other commercial spaces — book online with an
          upfront estimate in Toronto/GTA and South Florida.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`${routes.book}?service=office`}>
            <Button variant="accent" size="lg" className="h-12 rounded-lg px-6 font-semibold">
              Get started
            </Button>
          </Link>
          <Link href={routes.home}>
            <Button variant="secondary" size="lg" className="h-12 rounded-lg px-6 font-semibold">
              Back to home
            </Button>
          </Link>
        </div>
      </Container>
    </main>
  );
}
