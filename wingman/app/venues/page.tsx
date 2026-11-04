import { VenueListScreen } from "@/features/venues/VenueListScreen";
import { listPublicVenues } from "@/lib/venues/service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rooms — Wingman",
};

export const dynamic = "force-dynamic";

export default async function VenuesPage() {
  let venues = [] as Awaited<ReturnType<typeof listPublicVenues>>;
  try {
    venues = await listPublicVenues();
  } catch {
    venues = [];
  }
  return <VenueListScreen initialVenues={venues} />;
}
