import { Shield, CreditCard, BadgeCheck, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

const trustItems = [
  { icon: BadgeCheck, label: "Ops-reviewed Pros" },
  { icon: CreditCard, label: "Upfront estimates" },
  { icon: Shield, label: "Secure payments" },
  { icon: Headphones, label: "Customer support" },
] as const;

interface TrustBarProps {
  variant?: "hero" | "inline";
  className?: string;
}

export function TrustBar({ variant = "inline", className }: TrustBarProps) {
  return (
    <ul
      className={cn(
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
        variant === "hero" && "text-white/90",
        className,
      )}
      aria-label="Trust indicators"
    >
      {trustItems.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2.5 text-sm">
          <Icon
            className={cn(
              "size-4 shrink-0",
              variant === "hero" ? "text-teal-300" : "text-accent",
            )}
            aria-hidden
          />
          <span className={variant === "hero" ? "text-white/90" : "text-ink-muted"}>
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}
