import { CommercialBookServiceStep } from "@/components/commercial/commercial-book-service-step";

export const metadata = {
  title: "What needs cleaning",
  robots: { index: false, follow: false },
};

export default function CommercialServicePage() {
  return <CommercialBookServiceStep publicPath />;
}
