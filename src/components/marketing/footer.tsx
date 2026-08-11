import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";
import { getActiveMarkets } from "@/config/markets";
import { routes, siteConfig } from "@/config/site";
import { Container } from "@/components/ui";

const footerSections = [
  {
    title: "Services",
    links: [
      { label: "Residential Cleaning", href: `${routes.book}?service=standard` },
      { label: "Deep Cleaning", href: `${routes.book}?service=deep` },
      { label: "Move In / Out Cleaning", href: `${routes.book}?service=move_in` },
      { label: "Commercial Cleaning", href: routes.forBusiness },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Become a Pro", href: routes.becomeCleaner },
      { label: "About", href: routes.about },
      { label: "How it works", href: `${routes.home}#how-it-works` },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Support", href: siteConfig.links.support },
      { label: "Privacy", href: routes.legal.privacy },
      { label: "Terms", href: routes.legal.terms },
    ],
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();
  const marketsLine = getActiveMarkets()
    .map((m) => m.name)
    .join(" · ");

  return (
    <footer className="border-t border-border bg-surface">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <SiteLogo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-ink-muted">
              Cleaning, on demand. Upfront estimates, secure payments, support when you need it.
            </p>
            <p className="mt-3 max-w-xs text-xs leading-5 text-ink-subtle">
              Markets: {marketsLine}
            </p>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <p className="text-sm font-semibold text-ink">{section.title}</p>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-muted transition-colors duration-200 hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-sm text-ink-subtle sm:flex-row sm:justify-between">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href={routes.legal.privacy} className="hover:text-ink">
              Privacy
            </Link>
            <Link href={routes.legal.terms} className="hover:text-ink">
              Terms
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
