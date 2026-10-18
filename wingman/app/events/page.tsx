import { EventsScreen } from "@/features/events/components/EventsScreen";
import { loadMappedPublicEvents } from "@/lib/marketplace/public-feed";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search — Wingman",
};

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  let events = [] as Awaited<ReturnType<typeof loadMappedPublicEvents>>;
  try {
    events = await loadMappedPublicEvents();
  } catch {
    events = [];
  }
  return <EventsScreen initialEvents={events} />;
}
