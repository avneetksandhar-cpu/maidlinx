/** Booking engine service ids used by forms / pricing (legacy-compatible). */
export const BOOKING_SERVICES = [
  { id: "standard", label: "Residential", description: "Regular maintenance clean for occupied homes." },
  { id: "deep", label: "Deep clean", description: "Detailed top-to-bottom clean with extra attention." },
  { id: "move_in", label: "Move-in", description: "Fresh start before you unpack." },
  { id: "move_out", label: "Move-out", description: "Leave the space spotless for turnover." },
  { id: "office", label: "Office & commercial", description: "Professional cleaning for offices and workspaces." },
  { id: "airbnb_turnover", label: "Airbnb / STR", description: "Fast turnovers between guest stays." },
  { id: "post_construction", label: "Post-construction", description: "Dust, debris, and finish cleaning after renovations." },
  { id: "event_venue", label: "Event / venue", description: "Pre- or post-event venue cleaning." },
] as const;

export type BookingServiceId = (typeof BOOKING_SERVICES)[number]["id"];

export function getBookingServiceLabel(serviceType: string): string {
  const match = BOOKING_SERVICES.find((service) => service.id === serviceType);
  if (match) return match.label;
  return serviceType
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const BOOKING_EXTRAS = [
  { id: "inside_fridge", label: "Inside fridge", priceCents: 2500 },
  { id: "inside_oven", label: "Inside oven", priceCents: 2500 },
  { id: "inside_cabinets", label: "Inside cabinets", priceCents: 3500 },
  { id: "laundry", label: "Laundry", priceCents: 2000 },
  { id: "windows", label: "Interior windows", priceCents: 4000 },
  { id: "garage", label: "Garage", priceCents: 3000 },
  { id: "patio", label: "Patio / balcony", priceCents: 2500 },
] as const;

export type BookingExtraId = (typeof BOOKING_EXTRAS)[number]["id"];

export const ARRIVAL_WINDOWS = [
  { id: "morning", label: "Morning", description: "8:00 AM – 12:00 PM", startHour: 8, endHour: 12 },
  { id: "afternoon", label: "Afternoon", description: "12:00 PM – 4:00 PM", startHour: 12, endHour: 16 },
  { id: "evening", label: "Evening", description: "4:00 PM – 8:00 PM", startHour: 16, endHour: 20 },
] as const;

export type ArrivalWindowId = (typeof ARRIVAL_WINDOWS)[number]["id"];

export const BOOKING_STEPS = [
  { id: 1, label: "Address" },
  { id: 2, label: "Property" },
  { id: 3, label: "Service" },
  { id: 4, label: "Extras" },
  { id: 5, label: "Schedule" },
  { id: 6, label: "Price" },
  { id: 7, label: "Contact" },
  { id: 8, label: "Checkout" },
  { id: 9, label: "Confirm" },
] as const;

export const BOOKING_STEP_COUNT = BOOKING_STEPS.length;

export const PLATFORM_FEE_PERCENT = 15;
