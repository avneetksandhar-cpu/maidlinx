import { redirect } from "next/navigation";
import { routes } from "@/config/site";

export default function LegacyProfilePage() {
  redirect(routes.dashboardProfile);
}
