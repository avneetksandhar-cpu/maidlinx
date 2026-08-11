import type { ServiceQuestion } from "@/config/services";
import type { BookingServiceId } from "@/lib/bookings/constants";

/**
 * Customer-facing property types for the booking funnel.
 * Stored on BookingState / serviceAnswers — not a DB enum.
 */

export const PROPERTY_TYPES = [
  {
    id: "house",
    label: "House",
    shortLabel: "House",
    description: "Single-family home",
    icon: "home",
    questionSet: "residential",
    defaultServiceType: "standard" as BookingServiceId,
    defaultServiceSlug: "residential",
  },
  {
    id: "apartment",
    label: "Apt / Condo",
    shortLabel: "Apt",
    description: "Apartment or condo unit",
    icon: "building",
    questionSet: "residential",
    defaultServiceType: "standard" as BookingServiceId,
    defaultServiceSlug: "residential",
  },
  {
    id: "office",
    label: "Office",
    shortLabel: "Office",
    description: "Workspace or suite",
    icon: "briefcase",
    questionSet: "commercial",
    defaultServiceType: "office" as BookingServiceId,
    defaultServiceSlug: "office",
  },
  {
    id: "retail",
    label: "Retail",
    shortLabel: "Retail",
    description: "Storefront or boutique",
    icon: "store",
    questionSet: "commercial",
    defaultServiceType: "office" as BookingServiceId,
    defaultServiceSlug: "office",
  },
  {
    id: "restaurant",
    label: "Restaurant",
    shortLabel: "Restaurant",
    description: "Kitchen & dining space",
    icon: "utensils",
    questionSet: "commercial",
    defaultServiceType: "office" as BookingServiceId,
    defaultServiceSlug: "office",
  },
  {
    id: "airbnb",
    label: "Airbnb",
    shortLabel: "Airbnb",
    description: "Short-term rental turnover",
    icon: "key",
    questionSet: "airbnb",
    defaultServiceType: "airbnb_turnover" as BookingServiceId,
    defaultServiceSlug: "airbnb",
  },
  {
    id: "move",
    label: "Move-in / out",
    shortLabel: "Move",
    description: "Empty or nearly empty home",
    icon: "truck",
    questionSet: "move",
    defaultServiceType: "move_out" as BookingServiceId,
    defaultServiceSlug: "move-out",
  },
  {
    id: "post_construction",
    label: "Post-construction",
    shortLabel: "Construction",
    description: "After reno or build",
    icon: "hammer",
    questionSet: "construction",
    defaultServiceType: "post_construction" as BookingServiceId,
    defaultServiceSlug: "post-construction",
  },
  {
    id: "commercial",
    label: "Commercial",
    shortLabel: "Commercial",
    description: "Other business space",
    icon: "building-2",
    questionSet: "commercial",
    defaultServiceType: "office" as BookingServiceId,
    defaultServiceSlug: "office",
  },
  {
    id: "other",
    label: "Other",
    shortLabel: "Other",
    description: "Tell us what you need",
    icon: "more-horizontal",
    questionSet: "other",
    defaultServiceType: "standard" as BookingServiceId,
    defaultServiceSlug: "residential",
  },
] as const;

export type PropertyTypeId = (typeof PROPERTY_TYPES)[number]["id"];

export function getPropertyType(id: string | null | undefined) {
  if (id === "condo") return PROPERTY_TYPES.find((p) => p.id === "apartment");
  return PROPERTY_TYPES.find((p) => p.id === id);
}

const residentialQuestions: ServiceQuestion[] = [
  {
    id: "bedrooms",
    label: "Bedrooms",
    type: "number",
    required: true,
    min: 0,
    max: 20,
    mapsTo: "bedrooms",
  },
  {
    id: "bathrooms",
    label: "Bathrooms",
    type: "number",
    required: true,
    min: 1,
    max: 20,
    mapsTo: "bathrooms",
  },
  {
    id: "squareFootage",
    label: "Approximate size",
    type: "select",
    required: true,
    mapsTo: "squareFootage",
    options: [
      { value: "800", label: "Up to 1,000 sq ft" },
      { value: "1500", label: "1,001 – 2,000 sq ft" },
      { value: "2500", label: "2,001 – 3,000 sq ft" },
      { value: "3500", label: "3,001+ sq ft" },
    ],
  },
];

const commercialQuestions: ServiceQuestion[] = [
  {
    id: "squareFootage",
    label: "Approximate size",
    type: "select",
    required: true,
    mapsTo: "squareFootage",
    options: [
      { value: "800", label: "Up to 1,000 sq ft" },
      { value: "1500", label: "1,001 – 2,000 sq ft" },
      { value: "2500", label: "2,001 – 3,000 sq ft" },
      { value: "3500", label: "3,001 – 5,000 sq ft" },
      { value: "5000", label: "5,001+ sq ft" },
    ],
  },
  {
    id: "bathrooms",
    label: "Restrooms",
    type: "number",
    required: true,
    min: 1,
    max: 30,
    mapsTo: "bathrooms",
  },
  {
    id: "businessType",
    label: "Business type",
    type: "select",
    required: false,
    options: [
      { value: "office", label: "Office" },
      { value: "retail", label: "Retail" },
      { value: "restaurant", label: "Restaurant" },
      { value: "medical", label: "Medical / clinic" },
      { value: "other", label: "Other" },
    ],
  },
];

const airbnbQuestions: ServiceQuestion[] = [
  ...residentialQuestions,
  {
    id: "turnoverDeadline",
    label: "Turnover deadline",
    type: "select",
    required: false,
    options: [
      { value: "same_day", label: "Same day" },
      { value: "next_morning", label: "Next morning" },
      { value: "flexible", label: "Flexible" },
    ],
  },
];

const moveQuestions: ServiceQuestion[] = [
  ...residentialQuestions,
  {
    id: "moveDirection",
    label: "Move type",
    type: "select",
    required: true,
    options: [
      { value: "move_in", label: "Move-in" },
      { value: "move_out", label: "Move-out" },
    ],
  },
];

const constructionQuestions: ServiceQuestion[] = [
  {
    id: "squareFootage",
    label: "Approximate size",
    type: "select",
    required: true,
    mapsTo: "squareFootage",
    options: [
      { value: "800", label: "Up to 1,000 sq ft" },
      { value: "1500", label: "1,001 – 2,000 sq ft" },
      { value: "2500", label: "2,001 – 3,000 sq ft" },
      { value: "3500", label: "3,001+ sq ft" },
    ],
  },
  {
    id: "projectType",
    label: "Project type",
    type: "select",
    required: false,
    options: [
      { value: "renovation", label: "Renovation" },
      { value: "new_build", label: "New build" },
      { value: "partial", label: "Partial remodel" },
    ],
  },
];

const otherQuestions: ServiceQuestion[] = [
  ...residentialQuestions,
  {
    id: "otherNotes",
    label: "What needs cleaning?",
    type: "text",
    required: true,
    mapsTo: "notes",
  },
];

const QUESTION_SETS: Record<string, ServiceQuestion[]> = {
  residential: residentialQuestions,
  commercial: commercialQuestions,
  airbnb: airbnbQuestions,
  move: moveQuestions,
  construction: constructionQuestions,
  other: otherQuestions,
};

export function getPropertyQuestions(propertyTypeId: string | null | undefined): ServiceQuestion[] {
  const normalized = propertyTypeId === "condo" ? "apartment" : propertyTypeId;
  const property = getPropertyType(normalized);
  if (!property) return residentialQuestions;
  return QUESTION_SETS[property.questionSet] ?? residentialQuestions;
}
