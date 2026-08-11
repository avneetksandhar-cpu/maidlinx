/**
 * Marketplace service catalog.
 * One booking engine; questions and pricing model vary by service.
 */

export type PricingModel = "instant" | "quote";

export type ServiceQuestionType =
  | "number"
  | "select"
  | "boolean"
  | "text"
  | "multiselect";

export interface ServiceQuestion {
  id: string;
  label: string;
  type: ServiceQuestionType;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  /** Maps common residential fields onto booking form state. */
  mapsTo?:
    | "bedrooms"
    | "bathrooms"
    | "squareFootage"
    | "notes"
    | "extras"
    | "propertyType";
}

export type ServiceCategory =
  | "residential"
  | "deep"
  | "move"
  | "airbnb"
  | "office"
  | "post_construction"
  | "event"
  | "recurring";

export interface EstimatedDurationRules {
  baseMinutes: number;
  minutesPerBedroom?: number;
  minutesPerBathroom?: number;
  minutesPerExtra?: number;
  /** Minutes added per 500 sq ft over 1000. */
  minutesPerSizeTier?: number;
}

export interface CleanerRequirements {
  /** Minimum years of experience (0 = none). */
  minYearsExperience: number;
  /** Require is_verified / approved cleaner. */
  requiresApproved: boolean;
  /** Optional qualification tags the cleaner must hold. */
  qualifications: string[];
}

export interface MarketplaceService {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: ServiceCategory;
  active: boolean;
  pricingModel: PricingModel;
  /** Market ids from config/markets — empty means all active markets. */
  supportedMarkets: string[];
  requiredQuestions: ServiceQuestion[];
  estimatedDurationRules: EstimatedDurationRules;
  cleanerRequirements: CleanerRequirements;
  /** Homepage / picker tile grouping. */
  tileKey: "home" | "office" | "airbnb" | "move" | "construction" | "more";
  /** Compatible with existing bookings.service_type enum values where possible. */
  legacyServiceType: string;
}

const defaultResidentialRequirements: CleanerRequirements = {
  minYearsExperience: 0,
  requiresApproved: true,
  qualifications: [],
};

const specialtyRequirements: CleanerRequirements = {
  minYearsExperience: 1,
  requiresApproved: true,
  qualifications: [],
};

const residentialRooms: ServiceQuestion[] = [
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
    label: "Approximate square footage",
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

export const MARKETPLACE_SERVICES: MarketplaceService[] = [
  {
    id: "svc_residential",
    slug: "residential",
    name: "Residential",
    description: "Regular maintenance clean for occupied homes.",
    icon: "home",
    category: "residential",
    active: true,
    pricingModel: "instant",
    supportedMarkets: [],
    tileKey: "home",
    legacyServiceType: "standard",
    estimatedDurationRules: {
      baseMinutes: 120,
      minutesPerBedroom: 20,
      minutesPerBathroom: 15,
      minutesPerExtra: 20,
      minutesPerSizeTier: 15,
    },
    cleanerRequirements: defaultResidentialRequirements,
    requiredQuestions: [
      ...residentialRooms,
      {
        id: "propertyType",
        label: "Property type",
        type: "select",
        required: true,
        mapsTo: "propertyType",
        options: [
          { value: "house", label: "House" },
          { value: "condo", label: "Condo" },
          { value: "apartment", label: "Apartment" },
        ],
      },
    ],
  },
  {
    id: "svc_deep",
    slug: "deep",
    name: "Deep clean",
    description: "Detailed top-to-bottom clean with extra attention.",
    icon: "sparkles",
    category: "deep",
    active: true,
    pricingModel: "instant",
    supportedMarkets: [],
    tileKey: "home",
    legacyServiceType: "deep",
    estimatedDurationRules: {
      baseMinutes: 180,
      minutesPerBedroom: 20,
      minutesPerBathroom: 15,
      minutesPerExtra: 20,
      minutesPerSizeTier: 15,
    },
    cleanerRequirements: specialtyRequirements,
    requiredQuestions: [
      ...residentialRooms,
      {
        id: "lastCleaned",
        label: "When was it last cleaned?",
        type: "select",
        required: false,
        options: [
          { value: "under_1_month", label: "Within a month" },
          { value: "1_3_months", label: "1–3 months ago" },
          { value: "over_3_months", label: "Over 3 months ago" },
          { value: "never", label: "Never / unknown" },
        ],
      },
    ],
  },
  {
    id: "svc_move_in",
    slug: "move-in",
    name: "Move-in",
    description: "Fresh start before you unpack.",
    icon: "truck",
    category: "move",
    active: true,
    pricingModel: "instant",
    supportedMarkets: [],
    tileKey: "move",
    legacyServiceType: "move_in",
    estimatedDurationRules: {
      baseMinutes: 210,
      minutesPerBedroom: 20,
      minutesPerBathroom: 15,
      minutesPerExtra: 20,
      minutesPerSizeTier: 15,
    },
    cleanerRequirements: specialtyRequirements,
    requiredQuestions: [
      ...residentialRooms,
      {
        id: "emptyProperty",
        label: "Is the property empty?",
        type: "boolean",
        required: true,
      },
    ],
  },
  {
    id: "svc_move_out",
    slug: "move-out",
    name: "Move-out",
    description: "Leave the space spotless for turnover.",
    icon: "truck",
    category: "move",
    active: true,
    pricingModel: "instant",
    supportedMarkets: [],
    tileKey: "move",
    legacyServiceType: "move_out",
    estimatedDurationRules: {
      baseMinutes: 210,
      minutesPerBedroom: 20,
      minutesPerBathroom: 15,
      minutesPerExtra: 20,
      minutesPerSizeTier: 15,
    },
    cleanerRequirements: specialtyRequirements,
    requiredQuestions: [
      ...residentialRooms,
      {
        id: "emptyProperty",
        label: "Is the property empty?",
        type: "boolean",
        required: true,
      },
    ],
  },
  {
    id: "svc_airbnb",
    slug: "airbnb",
    name: "Airbnb / STR",
    description: "Fast turnovers between guest stays.",
    icon: "key",
    category: "airbnb",
    active: true,
    pricingModel: "instant",
    supportedMarkets: [],
    tileKey: "airbnb",
    legacyServiceType: "airbnb_turnover",
    estimatedDurationRules: {
      baseMinutes: 90,
      minutesPerBedroom: 15,
      minutesPerBathroom: 10,
      minutesPerExtra: 15,
      minutesPerSizeTier: 10,
    },
    cleanerRequirements: {
      minYearsExperience: 0,
      requiresApproved: true,
      qualifications: ["str_turnover"],
    },
    requiredQuestions: [
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
        id: "turnoverDeadline",
        label: "Turnover deadline",
        type: "select",
        required: true,
        options: [
          { value: "same_day_morning", label: "Same-day morning" },
          { value: "same_day_afternoon", label: "Same-day afternoon" },
          { value: "next_day", label: "Next day" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "linens",
        label: "Change linens?",
        type: "boolean",
        required: true,
      },
      {
        id: "laundry",
        label: "Include laundry?",
        type: "boolean",
        required: true,
      },
      {
        id: "supplies",
        label: "Restock guest supplies?",
        type: "boolean",
        required: false,
      },
    ],
  },
  {
    id: "svc_office",
    slug: "office",
    name: "Office & commercial",
    description: "Professional cleaning for offices and workspaces.",
    icon: "building",
    category: "office",
    active: true,
    pricingModel: "quote",
    supportedMarkets: [],
    tileKey: "office",
    legacyServiceType: "office",
    estimatedDurationRules: {
      baseMinutes: 150,
      minutesPerExtra: 20,
      minutesPerSizeTier: 20,
    },
    cleanerRequirements: {
      minYearsExperience: 1,
      requiresApproved: true,
      qualifications: ["commercial"],
    },
    requiredQuestions: [
      {
        id: "businessType",
        label: "Business type",
        type: "select",
        required: true,
        options: [
          { value: "office", label: "Office" },
          { value: "retail", label: "Retail" },
          { value: "medical", label: "Medical / clinic" },
          { value: "warehouse", label: "Warehouse" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "squareFootage",
        label: "Approximate square footage",
        type: "select",
        required: true,
        mapsTo: "squareFootage",
        options: [
          { value: "1500", label: "Under 2,000 sq ft" },
          { value: "3500", label: "2,000 – 5,000 sq ft" },
          { value: "7500", label: "5,000 – 10,000 sq ft" },
          { value: "15000", label: "10,000+ sq ft" },
        ],
      },
      {
        id: "bathrooms",
        label: "Bathrooms",
        type: "number",
        required: true,
        min: 1,
        max: 50,
        mapsTo: "bathrooms",
      },
      {
        id: "frequency",
        label: "Cleaning frequency",
        type: "select",
        required: true,
        options: [
          { value: "one_time", label: "One-time" },
          { value: "weekly", label: "Weekly" },
          { value: "biweekly", label: "Bi-weekly" },
          { value: "monthly", label: "Monthly" },
        ],
      },
      {
        id: "operatingSchedule",
        label: "Operating schedule",
        type: "select",
        required: true,
        options: [
          { value: "business_hours", label: "During business hours" },
          { value: "after_hours", label: "After hours" },
          { value: "weekends", label: "Weekends" },
          { value: "flexible", label: "Flexible" },
        ],
      },
      {
        id: "notes",
        label: "Special requirements",
        type: "text",
        required: false,
        mapsTo: "notes",
      },
    ],
  },
  {
    id: "svc_post_construction",
    slug: "post-construction",
    name: "Post-construction",
    description: "Dust, debris, and finish cleaning after renovations.",
    icon: "hard-hat",
    category: "post_construction",
    active: true,
    pricingModel: "quote",
    supportedMarkets: [],
    tileKey: "construction",
    legacyServiceType: "post_construction",
    estimatedDurationRules: {
      baseMinutes: 240,
      minutesPerExtra: 30,
      minutesPerSizeTier: 25,
    },
    cleanerRequirements: {
      minYearsExperience: 2,
      requiresApproved: true,
      qualifications: ["post_construction"],
    },
    requiredQuestions: [
      {
        id: "projectType",
        label: "Project type",
        type: "select",
        required: true,
        options: [
          { value: "renovation", label: "Renovation" },
          { value: "new_build", label: "New build" },
          { value: "remodel", label: "Remodel" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "squareFootage",
        label: "Approximate square footage",
        type: "select",
        required: true,
        mapsTo: "squareFootage",
        options: [
          { value: "1500", label: "Under 2,000 sq ft" },
          { value: "3500", label: "2,000 – 5,000 sq ft" },
          { value: "7500", label: "5,000 – 10,000 sq ft" },
          { value: "15000", label: "10,000+ sq ft" },
        ],
      },
      {
        id: "constructionStage",
        label: "Construction stage",
        type: "select",
        required: true,
        options: [
          { value: "rough", label: "Rough clean" },
          { value: "final", label: "Final clean" },
          { value: "touch_up", label: "Touch-up" },
        ],
      },
      {
        id: "cleaningCondition",
        label: "Current cleaning condition",
        type: "select",
        required: true,
        options: [
          { value: "heavy_debris", label: "Heavy debris / dust" },
          { value: "moderate", label: "Moderate dust" },
          { value: "light", label: "Light touch-up needed" },
        ],
      },
      {
        id: "notes",
        label: "Special requirements",
        type: "text",
        required: false,
        mapsTo: "notes",
      },
    ],
  },
  {
    id: "svc_event",
    slug: "event-venue",
    name: "Event / venue",
    description: "Pre- or post-event venue cleaning.",
    icon: "calendar",
    category: "event",
    active: true,
    pricingModel: "quote",
    supportedMarkets: [],
    tileKey: "more",
    legacyServiceType: "event_venue",
    estimatedDurationRules: {
      baseMinutes: 180,
      minutesPerExtra: 20,
      minutesPerSizeTier: 20,
    },
    cleanerRequirements: {
      minYearsExperience: 1,
      requiresApproved: true,
      qualifications: ["event_venue"],
    },
    requiredQuestions: [
      {
        id: "squareFootage",
        label: "Venue size",
        type: "select",
        required: true,
        mapsTo: "squareFootage",
        options: [
          { value: "1500", label: "Small (under 2,000 sq ft)" },
          { value: "4000", label: "Medium (2,000 – 6,000)" },
          { value: "10000", label: "Large (6,000+)" },
        ],
      },
      {
        id: "eventTiming",
        label: "Timing",
        type: "select",
        required: true,
        options: [
          { value: "pre", label: "Before event" },
          { value: "post", label: "After event" },
          { value: "both", label: "Before and after" },
        ],
      },
      {
        id: "guestCount",
        label: "Approximate guest count",
        type: "number",
        required: false,
        min: 0,
        max: 5000,
      },
      {
        id: "notes",
        label: "Event details",
        type: "text",
        required: true,
        mapsTo: "notes",
      },
    ],
  },
  {
    id: "svc_recurring",
    slug: "recurring",
    name: "Recurring",
    description: "Weekly or bi-weekly home cleaning on a schedule.",
    icon: "repeat",
    category: "recurring",
    active: true,
    pricingModel: "instant",
    supportedMarkets: [],
    tileKey: "more",
    legacyServiceType: "standard",
    estimatedDurationRules: {
      baseMinutes: 120,
      minutesPerBedroom: 20,
      minutesPerBathroom: 15,
      minutesPerExtra: 20,
      minutesPerSizeTier: 15,
    },
    cleanerRequirements: defaultResidentialRequirements,
    requiredQuestions: [
      ...residentialRooms,
      {
        id: "frequency",
        label: "How often?",
        type: "select",
        required: true,
        options: [
          { value: "weekly", label: "Weekly" },
          { value: "biweekly", label: "Every 2 weeks" },
          { value: "monthly", label: "Monthly" },
        ],
      },
    ],
  },
];

/** Homepage tile definitions — primary UX entry. */
export const SERVICE_TILES = [
  {
    key: "home" as const,
    label: "Home",
    description: "Residential & deep cleans",
    defaultServiceSlug: "residential",
  },
  {
    key: "office" as const,
    label: "Office",
    description: "Workspaces & commercial",
    defaultServiceSlug: "office",
  },
  {
    key: "airbnb" as const,
    label: "Airbnb",
    description: "Short-term rental turnovers",
    defaultServiceSlug: "airbnb",
  },
  {
    key: "move" as const,
    label: "Move",
    description: "Move-in or move-out",
    defaultServiceSlug: "move-out",
  },
  {
    key: "construction" as const,
    label: "Construction",
    description: "Post-renovation cleans",
    defaultServiceSlug: "post-construction",
  },
  {
    key: "more" as const,
    label: "More",
    description: "Events, recurring & more",
    defaultServiceSlug: "recurring",
  },
] as const;

export type ServiceTileKey = (typeof SERVICE_TILES)[number]["key"];

export function getActiveServices(): MarketplaceService[] {
  return MARKETPLACE_SERVICES.filter((s) => s.active);
}

export function getServiceBySlug(slug: string): MarketplaceService | undefined {
  return MARKETPLACE_SERVICES.find((s) => s.slug === slug);
}

export function getServiceById(id: string): MarketplaceService | undefined {
  return MARKETPLACE_SERVICES.find((s) => s.id === id);
}

export function getServiceByLegacyType(legacy: string): MarketplaceService | undefined {
  return MARKETPLACE_SERVICES.find((s) => s.legacyServiceType === legacy);
}

export function getServicesForMarket(marketId: string): MarketplaceService[] {
  return getActiveServices().filter(
    (s) => s.supportedMarkets.length === 0 || s.supportedMarkets.includes(marketId),
  );
}

export function getServicesForTile(tileKey: ServiceTileKey): MarketplaceService[] {
  return getActiveServices().filter((s) => s.tileKey === tileKey);
}

/** Booking engine service ids used in forms / pricing (legacy-compatible). */
export const BOOKING_SERVICE_IDS = [
  "standard",
  "deep",
  "move_in",
  "move_out",
  "office",
  "airbnb_turnover",
  "post_construction",
  "event_venue",
] as const;

export type BookingServiceId = (typeof BOOKING_SERVICE_IDS)[number];

export function isQuoteOnlyService(serviceType: string): boolean {
  const svc =
    getServiceByLegacyType(serviceType) ??
    getServiceBySlug(serviceType) ??
    MARKETPLACE_SERVICES.find((s) => s.id === serviceType);
  return svc?.pricingModel === "quote";
}

export function serviceSupportsMarket(
  service: MarketplaceService,
  marketId: string | null | undefined,
): boolean {
  if (!marketId) return service.supportedMarkets.length === 0;
  if (service.supportedMarkets.length === 0) return true;
  return service.supportedMarkets.includes(marketId);
}
