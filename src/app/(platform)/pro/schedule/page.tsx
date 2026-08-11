import { redirect } from "next/navigation";
import { routes } from "@/config/site";

export default function ProSchedulePage() {
  redirect(`${routes.proJobs}?tab=assigned`);
}
