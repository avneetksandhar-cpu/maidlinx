import { jsonError, jsonSuccess } from "@/lib/api/response";
import { listConnectAccounts, listStripePayouts } from "@/lib/admin/payouts";
import { requireAdminApiPermission } from "@/lib/admin/session";

export async function GET() {
  try {
    await requireAdminApiPermission("payouts.read");
    const [payouts, connectAccounts] = await Promise.all([
      listStripePayouts(),
      listConnectAccounts(),
    ]);
    return jsonSuccess({ payouts, connectAccounts });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load payouts.", 403);
  }
}
