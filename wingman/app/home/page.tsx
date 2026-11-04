import { DiscoverScreen } from "@/features/discover/DiscoverScreen";
import { loadMappedPublicEvents } from "@/lib/marketplace/public-feed";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover — Wingman",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let events = [] as Awaited<ReturnType<typeof loadMappedPublicEvents>>;
  try {
    events = await loadMappedPublicEvents();
  } catch {
    events = [];
  }
  return (
    <DiscoverScreen
      initialEvents={events}
      initialBookableCount={events.filter((event) => event.bookable).length}
    />
  );
}
