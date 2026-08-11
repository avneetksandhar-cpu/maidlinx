import { jsonError, jsonSuccess } from "@/lib/api/response";
import { listPayments } from "@/lib/admin/payments";
import { requireAdminApiPermission } from "@/lib/admin/session";

export async function GET(request: Request) {
  try {
    await requireAdminApiPermission("payments.read");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const payments = await listPayments(search);
    return jsonSuccess({ payments });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load payments.", 403);
  }
}
