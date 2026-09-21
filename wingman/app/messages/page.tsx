import { MessagesScreen } from "@/features/messages/components/MessagesScreen";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat — Wingman",
};

export default function MessagesPage() {
  return <MessagesScreen />;
}
