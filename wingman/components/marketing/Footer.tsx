import Link from "next/link";

const footerLinks = {
  Product: [
    { href: "#experiences", label: "Experiences" },
    { href: "#membership", label: "Membership" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "/onboarding", label: "Get Started" },
  ],
  Company: [
    { href: "#about", label: "About" },
    { href: "#", label: "Careers" },
    { href: "#", label: "Press" },
    { href: "#", label: "Contact" },
  ],
  Legal: [
    { href: "#", label: "Terms" },
    { href: "#", label: "Privacy" },
    { href: "#", label: "Cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-16">
      <div className="section-container">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.35em] text-ink"
            >
              Wingman
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              Miami&apos;s private marketplace for exclusive experiences.
              Verified hosts. VIP access. Members only.
            </p>
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
