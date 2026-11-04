import { redirect } from "next/navigation";
import { routes } from "@/config/site";

/** Legacy My Home / Properties → commercial Sites. */
export default function SavedPlacesRedirectPage() {
  redirect(routes.dashboardSites);
}
