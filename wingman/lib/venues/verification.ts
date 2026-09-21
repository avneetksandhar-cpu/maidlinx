import type { VenueApplicationInput, VenueCategory } from "@/lib/venues/types";
import { VENUE_CATEGORIES } from "@/lib/venues/types";

export const VENUE_VERIFY_GATES = [
  "brand_profile",
  "official_presence",
  "operating_details",
  "legal_entity",
  "authorized_contact",
  "authority_attested",
  "accuracy_attested",
  "media_rights_attested",
] as const;

export type VenueVerifyGate = (typeof VENUE_VERIFY_GATES)[number];

export type VenueVerifyChecklist = Record<VenueVerifyGate, boolean>;

export function emptyVenueChecklist(): VenueVerifyChecklist {
  return {
    brand_profile: false,
    official_presence: false,
    operating_details: false,
    legal_entity: false,
    authorized_contact: false,
    authority_attested: false,
    accuracy_attested: false,
    media_rights_attested: false,
  };
}

function filled(value: string | undefined): boolean {
  return Boolean(value && value.trim().length >= 2);
}

function isEmail(value: string | undefined): boolean {
  return Boolean(value && value.includes("@") && value.includes("."));
}

export function venueChecklistFromInput(input: VenueApplicationInput): VenueVerifyChecklist {
  return {
    brand_profile:
      filled(input.venueName) &&
      VENUE_CATEGORIES.includes(input.venueType as VenueCategory) &&
      filled(input.address) &&
      filled(input.neighborhood) &&
      filled(input.description),
    official_presence: filled(input.website) || filled(input.instagram),
    operating_details: filled(input.hoursText) && filled(input.musicGenres) && filled(input.dressCode),
    legal_entity: filled(input.legalName) && filled(input.licenseNumber),
    authorized_contact:
      filled(input.contactName) &&
      filled(input.contactTitle) &&
      isEmail(input.businessEmail) &&
      filled(input.phone),
    authority_attested: Boolean(input.authorityAttested),
    accuracy_attested: Boolean(input.accuracyAttested),
    media_rights_attested: Boolean(input.mediaRightsAttested),
  };
}

export function venueChecklistComplete(checklist: VenueVerifyChecklist): boolean {
  return VENUE_VERIFY_GATES.every((gate) => checklist[gate]);
}

export function validateVenueApplication(input: VenueApplicationInput): VenueVerifyChecklist {
  const checklist = venueChecklistFromInput(input);
  if (!venueChecklistComplete(checklist)) {
    throw new Error("Complete every brand and verification step before submitting.");
  }
  return checklist;
}
