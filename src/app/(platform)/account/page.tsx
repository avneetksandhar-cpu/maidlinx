import { redirect } from "next/navigation";
import { routes } from "@/config/site";

/** Customer home alias — canonical UI remains /dashboard. */
export default function AccountPage() {
  redirect(routes.dashboard);
}
