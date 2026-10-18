import { RequestDetailScreen } from "@/features/requests/components/RequestDetailScreen";

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; cancelled?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return (
    <RequestDetailScreen
      id={id}
      justPaid={query.paid === "1"}
      cancelled={query.cancelled === "1"}
    />
  );
}
