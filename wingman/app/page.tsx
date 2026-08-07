import { SplashScreen } from "@/components/app/SplashScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wingman",
  description: "Private access to Miami's finest experiences.",
};

export default function SplashPage() {
  return <SplashScreen />;
}
