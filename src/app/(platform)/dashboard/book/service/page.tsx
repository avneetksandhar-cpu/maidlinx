import { CommercialBookServiceStep } from "@/components/commercial/commercial-book-service-step";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Choose service",
};

export default async function CommercialBookServicePage() {
  await requireCustomerSession();
  return <CommercialBookServiceStep />;
}
