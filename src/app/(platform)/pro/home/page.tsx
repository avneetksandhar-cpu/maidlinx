import { redirect } from "next/navigation";
import { routes } from "@/config/site";

/** Cleaner home alias used by session routing. */
export default function ProHomePage() {
  redirect(routes.proDashboard);
}
