/** Structured cleaning address used by booking + saved places. */
export interface StructuredAddress {
  formattedAddress?: string;
  addressLine1: string;
  unit?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  streetNumber?: string;
  route?: string;
}

export interface SavedAddress extends StructuredAddress {
  id: string;
  label: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ADDRESS_LABEL_PRESETS = [
  "Office",
  "Storefront",
  "Property",
  "Home",
  "Rental",
  "Other",
] as const;
export type AddressLabelPreset = (typeof ADDRESS_LABEL_PRESETS)[number];

/** Infer commercial site kind from a saved-place label (honest heuristics only). */
export function inferSiteKind(
  label: string,
): "office" | "retail" | "property" | "home" | "other" {
  const t = label.trim().toLowerCase();
  if (/\b(office|workspace|cowork)/.test(t)) return "office";
  if (/\b(store|storefront|retail|shop)/.test(t)) return "retail";
  if (/\b(property|building|facility|venue|restaurant)/.test(t)) return "property";
  if (/\b(home|house|apartment|condo|airbnb|rental)/.test(t)) return "home";
  return "other";
}
