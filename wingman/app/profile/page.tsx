import { ProfileScreen } from "@/features/profile/components/ProfileScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account — Wingman",
};

export default function ProfilePage() {
  return <ProfileScreen />;
}
