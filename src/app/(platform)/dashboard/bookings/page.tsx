import { redirect } from "next/navigation";
import { routes } from "@/config/site";

/** Legacy Bookings tab → commercial Jobs. */
export default function BookingsRedirectPage() {
  redirect(routes.dashboardJobs);
}
