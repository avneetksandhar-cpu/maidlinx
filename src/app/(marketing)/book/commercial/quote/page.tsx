import { CommercialQuoteForm } from "@/components/commercial/commercial-quote-form";

export const metadata = {
  title: "Request a quote",
  robots: { index: false, follow: false },
};

export default function CommercialQuotePage() {
  return <CommercialQuoteForm />;
}
