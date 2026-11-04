import { VenueProfileScreen } from "@/features/venues/VenueProfileScreen";

export default async function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VenueProfileScreen id={id} />;
}
