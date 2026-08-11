import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getOpsDashboardMetrics } from "@/lib/admin/ops-metrics";
import { getOpsQueueSummaries } from "@/lib/admin/queues";
import { getAdminSessionOrNull } from "@/lib/admin/session";

export async function GET() {
  try {
    const admin = await getAdminSessionOrNull();
    if (!admin) {
      return jsonError("Admin access denied.", 403);
    }

    const [metrics, queues] = await Promise.all([
      getOpsDashboardMetrics(),
      getOpsQueueSummaries(),
    ]);
    return jsonSuccess({ metrics, queues });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load dashboard.";
    const status = message.includes("denied") || message.includes("Insufficient") ? 403 : 500;
    return jsonError(message, status);
  }
}
