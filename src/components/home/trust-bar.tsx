import { Headset, Lock, Wallet } from "lucide-react";

const ITEMS = [
  {
    icon: Wallet,
    title: "Instant pricing",
    description: "Upfront, transparent rates",
  },
  {
    icon: Lock,
    title: "Secure payments",
    description: "Your payment information is processed securely",
  },
  {
    icon: Headset,
    title: "Customer support",
    description: "Help when you need it",
  },
] as const;

export function TrustBar() {
  return (
    <div className="mx-auto mt-10 max-w-4xl rounded-[22px] border border-[var(--maidlinx-border)] bg-white px-5 py-5 shadow-[var(--shadow-soft)] sm:mt-12 sm:px-8 sm:py-6">
      <ul className="grid gap-5 sm:grid-cols-3 sm:gap-6">
        {ITEMS.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex items-start gap-3">
            <Icon
              className="mt-0.5 size-5 shrink-0 text-[var(--maidlinx-green)]"
              strokeWidth={1.75}
              aria-hidden
            />
            <div>
              <p className="text-sm font-semibold text-[var(--maidlinx-ink)]">{title}</p>
              <p className="mt-0.5 text-xs leading-snug text-[var(--maidlinx-muted)] sm:text-sm">
                {description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
