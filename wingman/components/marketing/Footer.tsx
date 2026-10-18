import { WingmanWordmark } from "@/components/brand/WingmanLogo";
import { AppStoreButton } from "@/components/ui/app-store-button";
import Link from "next/link";

const footerLinks = {
  Product: [
    { href: "/events", label: "Tonight" },
    { href: "/plan", label: "Plan My Night" },
    { href: "/book", label: "Book $500" },
    { href: "#how-it-works", label: "How it works" },
  ],
  Company: [
    { href: "#about", label: "About" },
    { href: "#", label: "Careers" },
    { href: "#", label: "Press" },
    { href: "#", label: "Contact" },
  ],
  Legal: [
    { href: "/legal/terms", label: "Terms" },
    { href: "/legal/privacy", label: "Privacy" },
    { href: "/policies", label: "Policies" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-16">
      <div className="section-container">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label="Wingman home">
              <WingmanWordmark logoSize={24} />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              Miami nights: lounges, hookah, clubs, raves, events. One Wingman.
              $500 start-the-night service.
            </p>
            <div className="mt-6">
              <a
                href="#"
                aria-label="App Store download is not available. TestFlight is not live."
              >
                <AppStoreButton type="button" />
              </a>
              <p className="mt-2 max-w-xs text-xs text-ink-subtle">
                App Store listing coming soon.
              </p>
            </div>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-label font-medium text-accent">{group}</h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-ink-muted transition-colors hover:text-ink"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-ink-subtle">
            &copy; {new Date().getFullYear()} Wingman. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-ink-subtle hover:text-ink-muted" aria-label="Instagram">
              Instagram
            </a>
            <a href="#" className="text-xs text-ink-subtle hover:text-ink-muted" aria-label="LinkedIn">
              LinkedIn
            </a>
            <a href="#" className="text-xs text-ink-subtle hover:text-ink-muted" aria-label="X">
              X
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
