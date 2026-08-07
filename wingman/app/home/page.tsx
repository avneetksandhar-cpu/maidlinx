import { HomeScreen } from "@/features/home";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home — Wingman",
};

export default function HomePage() {
  return <HomeScreen />;
}
