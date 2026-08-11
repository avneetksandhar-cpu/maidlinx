"use client";

import {
  Home,
  Building2,
  Briefcase,
  Store,
  Utensils,
  KeyRound,
  Truck,
  Hammer,
  Building,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { PROPERTY_TYPES, type PropertyTypeId } from "@/config/property-types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  building: Building,
  briefcase: Briefcase,
  store: Store,
  utensils: Utensils,
  key: KeyRound,
  truck: Truck,
  hammer: Hammer,
  "building-2": Building2,
  "more-horizontal": MoreHorizontal,
};

const SECTIONS: Array<{
  id: string;
  label: string;
  questionSets: Array<(typeof PROPERTY_TYPES)[number]["questionSet"]>;
}> = [
  { id: "residential", label: "Home", questionSets: ["residential", "airbnb", "move"] },
  { id: "commercial", label: "Business", questionSets: ["commercial"] },
  { id: "specialty", label: "Specialty", questionSets: ["construction", "other"] },
];

interface PropertyTypeCardsProps {
  value?: PropertyTypeId | "condo" | null;
  onChange: (value: PropertyTypeId) => void;
  error?: string;
  className?: string;
}

export function PropertyTypeCards({ value, onChange, error, className }: PropertyTypeCardsProps) {
  return (
    <fieldset className={className}>
      <legend className="sr-only">Property type</legend>
      <div className="space-y-6">
        {SECTIONS.map((section) => {
          const types = PROPERTY_TYPES.filter((type) =>
            section.questionSets.includes(type.questionSet),
          );
          if (types.length === 0) return null;
          return (
            <div key={section.id}>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {section.label}
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {types.map((type) => {
                  const selected =
                    value === type.id || (value === "condo" && type.id === "apartment");
                  const Icon = ICONS[type.icon] ?? Home;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => onChange(type.id)}
                      aria-pressed={selected}
                      data-selected={selected}
                      className={cn(
                        "flex min-h-[6rem] flex-col items-start gap-2.5 rounded-xl border border-border bg-surface p-4 text-left transition-all duration-200",
                        "hover:border-border-strong hover:bg-surface-muted active:scale-[0.99]",
                        selected &&
                          "border-accent bg-accent-muted shadow-[0_0_0_1px_rgb(13_148_136_/_0.15)]",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg transition-colors",
                          selected ? "bg-accent text-white" : "bg-surface-muted text-navy",
                        )}
                      >
                        <Icon className="size-5" strokeWidth={2} aria-hidden />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-ink">{type.label}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-ink-muted">
                          {type.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </fieldset>
  );
}
