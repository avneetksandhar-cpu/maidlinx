import { CommercialBookPropertyStep } from "@/components/commercial/commercial-book-property-step";

export const metadata = {
  title: "Property type",
  robots: { index: false, follow: false },
};

export default function CommercialPropertyPage() {
  return <CommercialBookPropertyStep publicPath />;
}
