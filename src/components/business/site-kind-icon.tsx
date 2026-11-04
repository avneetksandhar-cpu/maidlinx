import { Building2, Home, Store } from "lucide-react";
import { inferSiteKind } from "@/lib/addresses/types";
import { cn } from "@/lib/utils";

export function SiteKindIcon({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const kind = inferSiteKind(label);
  const Icon =
    kind === "retail" ? Store : kind === "home" ? Home : Building2;

  return (
    <span
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--ml-dark-surface-2,#163556)] text-[#04CED2]",
        className,
      )}
      aria-hidden
    >
      <Icon className="size-6" strokeWidth={1.85} />
    </span>
  );
}

export function siteKindSubtitle(label: string, city?: string): string {
  const kind = inferSiteKind(label);
  const place = city?.trim() || "South Florida";
  const type =
    kind === "office"
      ? "Office"
      : kind === "retail"
        ? "Retail"
        : kind === "property"
          ? "Property"
          : kind === "home"
            ? "Home"
            : "Site";
  return `${place} · ${type}`;
}
