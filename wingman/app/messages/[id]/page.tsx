import { ChatScreen } from "@/features/messages";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat — Wingman",
};

export default function MessageThreadPage() {
  return <ChatScreen />;
}
