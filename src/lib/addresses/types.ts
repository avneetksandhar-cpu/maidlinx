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

export const ADDRESS_LABEL_PRESETS = ["Home", "Office", "Rental", "Other"] as const;
export type AddressLabelPreset = (typeof ADDRESS_LABEL_PRESETS)[number];
