import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";
import { routes, siteConfig } from "@/config/site";
import { Container } from "@/components/ui";
import { cn } from "@/lib/utils";

const footerLinks = [
  { label: "Residential Cleaning", href: `${routes.book}?service=standard` },
  { label: "Deep Cleaning", href: `${routes.book}?service=deep` },
  { label: "Move In / Out Cleaning", href: `${routes.book}?service=move_in` },
  { label: "Commercial Cleaning", href: routes.forBusiness },
  { label: "Become a Pro", href: routes.becomeCleaner },
  { label: "Support", href: siteConfig.links.support },
  { label: "Privacy", href: routes.legal.privacy },
  { label: "Terms", href: routes.legal.terms },
] as const;

export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className={cn("border-t border-border bg-surface", className)}>
      <Container className="flex flex-col gap-8 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <SiteLogo />
            <p className="mt-4 max-w-sm text-sm text-ink-muted">
              Cleaning, on demand — for homes and businesses.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Footer">
            {footerLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-ink-muted transition-colors duration-200 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="border-t border-border pt-6 text-sm text-ink-subtle">
          © {year} {siteConfig.name}
        </p>
      </Container>
    </footer>
  );
}
