export const CATALOG_KINDS = ["wingman_experience", "vip_table"] as const;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

export const EXPERIENCE_SLUGS = ["nightclub", "dinner", "yacht"] as const;
export type ExperienceSlug = (typeof EXPERIENCE_SLUGS)[number];

export const NIGHTCLUB_DRINKS = ["Tequila", "Vodka", "Cognac"] as const;
export type NightclubDrink = (typeof NIGHTCLUB_DRINKS)[number];

export type CatalogProduct = {
  id: string;
  slug: string;
  kind: CatalogKind;
  name: string;
  priceCents: number;
  includedCopy: string;
  extrasCopy: string;
  drinkOptions: string[];
  maxGuests: number | null;
  active: boolean;
  sortOrder: number;
};

export type CartItemKind = "vip_table" | "wingman_experience";

export type CartItemInput = {
  id: string;
  kind: CartItemKind;
  catalogSlug?: string;
  eventId?: string | null;
  eventExternalId?: string | null;
  offerId?: string | null;
  drinkOption?: string | null;
  guestCount: number;
  quantity?: number;
  startsAt?: string | null;
  venueName?: string | null;
  experienceName: string;
};

export type PricedCartItem = CartItemInput & {
  catalogId: string | null;
  unitPriceCents: number;
  label: string;
};

export const PLATFORM_TAKE_NOTES = {
  wingmanExperience: "Platform makes approximately $100 per Wingman Experience booking.",
  vipTable: "Platform receives 10% of the VIP table booking.",
  wingmanUpsell: "The venue may separately give the Wingman 10% on qualifying additional sales.",
} as const;

export const EXTRAS_DEFAULT =
  "Extra drinks, bottles, food, upgrades, tables, or other purchases are separate.";
