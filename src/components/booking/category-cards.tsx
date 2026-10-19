"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import type { PropertyTypeId } from "@/config/property-types";
import { cn } from "@/lib/utils";

export type BookingCategoryId = "home" | "airbnb" | "office" | "commercial";

export type BookingCategory = {
  id: BookingCategoryId;
  label: string;
  description: string;
  /** Maps to existing property-type catalog id */
  propertyType: PropertyTypeId;
  image: string;
};

export const BOOKING_CATEGORIES: BookingCategory[] = [
  {
    id: "home",
    label: "Home",
    description: "House, apartment, or condo",
    propertyType: "house",
    image: "/booking/cat-home.jpg",
  },
  {
    id: "airbnb",
    label: "Airbnb / Short-term",
    description: "Turnover between guests",
    propertyType: "airbnb",
    image: "/booking/cat-airbnb.jpg",
  },
  {
    id: "office",
    label: "Office",
    description: "Workspace or suite",
    propertyType: "office",
    image: "/booking/cat-office.jpg",
  },
  {
    id: "commercial",
    label: "Commercial",
    description: "Retail, restaurant, or other",
    propertyType: "commercial",
    image: "/booking/cat-commercial.jpg",
  },
];

interface CategoryCardsProps {
  value?: PropertyTypeId | "condo" | null;
  onChange: (propertyType: PropertyTypeId, categoryId: BookingCategoryId) => void;
  className?: string;
}

function selectedCategory(
  value?: PropertyTypeId | "condo" | null,
): BookingCategoryId | null {
  if (!value) return null;
  if (value === "house" || value === "apartment" || value === "condo" || value === "move") {
    return "home";
  }
  if (value === "airbnb") return "airbnb";
  if (value === "office") return "office";
  if (
    value === "commercial" ||
    value === "retail" ||
    value === "restaurant" ||
    value === "post_construction" ||
    value === "other"
  ) {
    return "commercial";
  }
  return null;
}

/**
 * Design-spec 2×2 image category grid: Home / Airbnb / Office / Commercial.
 */
export function CategoryCards({ value, onChange, className }: CategoryCardsProps) {
  const active = selectedCategory(value);

  return (
    <fieldset className={className}>
      <legend className="sr-only">What would you like cleaned?</legend>
      <div className="grid grid-cols-2 gap-2.5">
        {BOOKING_CATEGORIES.map((cat) => {
          const selected = active === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.propertyType, cat.id)}
              aria-pressed={selected}
              data-selected={selected}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200",
                "hover:border-[var(--ml-dark-mint)]/50 active:scale-[0.99]",
                selected
                  ? "border-[var(--ml-dark-mint)] shadow-[0_0_0_1px_rgb(8_224_212_/_0.45),0_0_28px_rgb(8_224_212_/_0.2)]"
                  : "border-[var(--ml-dark-border)]",
              )}
            >
              {/* Compact image so 2×2 fits ~390×844 without page scroll */}
              <span className="relative block h-[5.5rem] w-full overflow-hidden sm:h-28">
                <Image
                  src={cat.image}
                  alt=""
                  fill
                  sizes="(max-width: 680px) 45vw, 300px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-[var(--ml-dark-bg)]/90 via-[var(--ml-dark-bg)]/25 to-transparent" />
                {selected ? (
                  <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)] shadow-[0_0_16px_rgb(8_224_212_/_0.45)]">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                ) : null}
              </span>
              <span className="space-y-0.5 bg-[var(--ml-dark-surface)] px-3 py-2.5">
                <span className="block text-[14px] font-semibold leading-snug text-[var(--ml-dark-ink)] sm:text-[15px]">
                  {cat.label}
                </span>
                <span className="block text-[11px] leading-snug text-[var(--ml-dark-ink-muted)] sm:text-xs">
                  {cat.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
