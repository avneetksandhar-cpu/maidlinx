import { redirect } from "next/navigation";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";

export default function BookExtrasLegacyPage() {
  redirect(BOOKING_SCREEN_PATHS.addons);
}
