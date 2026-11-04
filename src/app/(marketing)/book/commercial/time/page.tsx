import { CommercialBookTimeStep } from "@/components/commercial/commercial-book-time-step";

export const metadata = {
  title: "Preferred time",
  robots: { index: false, follow: false },
};

export default function CommercialTimePage() {
  return <CommercialBookTimeStep publicPath />;
}
