import {
  NIGHTCLUB_DRINKS,
  type CartItemInput,
  type CatalogProduct,
  type NightclubDrink,
} from "@/lib/catalog/types";

export function isNightclubDrink(value: string | null | undefined): value is NightclubDrink {
  return Boolean(value && (NIGHTCLUB_DRINKS as readonly string[]).includes(value));
}

export function validateCartItem(item: CartItemInput, product: CatalogProduct | null): string | null {
  if (item.kind === "wingman_experience") {
    if (!product || !product.active || product.kind !== "wingman_experience") {
      return "That experience is not available.";
    }
    if (product.drinkOptions.length > 0) {
      if (!isNightclubDrink(item.drinkOption ?? null)) {
        return "Choose one drink: Tequila, Vodka, or Cognac.";
      }
    }
    if (product.maxGuests != null && item.guestCount > product.maxGuests) {
      return `${product.name} is limited to ${product.maxGuests} guests.`;
    }
    if (!Number.isInteger(item.guestCount) || item.guestCount < 1) {
      return "Guest count must be at least 1.";
    }
    return null;
  }

  if (item.kind === "vip_table") {
    if (!item.offerId) return "VIP tables are only available when a real table is bookable.";
    if (!Number.isInteger(item.guestCount) || item.guestCount < 1) {
      return "Guest count must be at least 1.";
    }
    return null;
  }

  return "Unknown booking option.";
}

export function experienceLabel(product: CatalogProduct, item: CartItemInput): string {
  if (product.slug === "nightclub" && item.drinkOption) {
    return `Nightclub · ${item.drinkOption}`;
  }
  return product.name;
}

export function platformTakeCents(kind: CartItemInput["kind"], priceCents: number): number {
  if (kind === "wingman_experience") return 10_000;
  return Math.round(priceCents * 0.1);
}
