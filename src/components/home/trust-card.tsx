import { Calendar, ShieldCheck, Star } from "lucide-react";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "Screened professionals",
    description: "Pros complete MaidLinx onboarding before jobs",
  },
  {
    icon: Star,
    title: "Satisfaction focused",
    description: "We're here to make things right",
  },
  {
    icon: Calendar,
    title: "Easy booking",
    description: "Book online in minutes",
  },
] as const;

export function TrustCard() {
  return (
    <div className="rounded-[20px] border border-[var(--maidlinx-border)] bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5">
      <ul className="grid gap-4 sm:grid-cols-3 sm:gap-0">
        {ITEMS.map(({ icon: Icon, title, description }, index) => (
          <li
            key={title}
            className={
              index > 0
                ? "sm:border-l sm:border-[var(--maidlinx-border)] sm:px-4 lg:px-5"
                : "sm:pr-4 lg:pr-5"
            }
          >
            <div className="flex items-start gap-3 sm:flex-col sm:gap-2">
              <Icon
                className="mt-0.5 size-5 shrink-0 text-[var(--maidlinx-green)]"
                strokeWidth={1.75}
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-[var(--maidlinx-ink)]">{title}</p>
                <p className="mt-0.5 text-xs leading-snug text-[var(--maidlinx-muted)]">
                  {description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
