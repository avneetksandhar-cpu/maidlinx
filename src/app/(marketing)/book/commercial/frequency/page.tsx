import { CommercialBookFrequencyStep } from "@/components/commercial/commercial-book-frequency-step";

export const metadata = {
  title: "How often",
  robots: { index: false, follow: false },
};

export default function CommercialFrequencyPage() {
  return <CommercialBookFrequencyStep publicPath />;
}
