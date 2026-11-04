import { CommercialBookFrequencyStep } from "@/components/commercial/commercial-book-frequency-step";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = {
  title: "Choose frequency",
};

export default async function CommercialBookFrequencyPage() {
  await requireCustomerSession();
  return <CommercialBookFrequencyStep />;
}
