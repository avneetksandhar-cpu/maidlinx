import type { Metadata } from "next";
import { AppOpenHome } from "@/components/home/app-open-home";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

/** App-open home — Uber-style request surface, not a marketing scroll page. */
export default function HomePage() {
  return <AppOpenHome />;
}
