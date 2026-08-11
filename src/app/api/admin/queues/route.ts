import { jsonError, jsonSuccess } from "@/lib/api/response";
import { listOpsQueues, OPS_QUEUE_KEYS, type OpsQueueKey } from "@/lib/admin/queues";
import { requireAdminApiPermission } from "@/lib/admin/session";

export async function GET(request: Request) {
  try {
    await requireAdminApiPermission("assignments.read");
    const { searchParams } = new URL(request.url);
    const queueParam = searchParams.get("queue");
    const filter = OPS_QUEUE_KEYS.includes(queueParam as OpsQueueKey)
      ? (queueParam as OpsQueueKey)
      : undefined;
    const queues = await listOpsQueues(filter);
    return jsonSuccess({ queues });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load queues.";
    const status = message.includes("denied") || message.includes("Insufficient") ? 403 : 400;
    return jsonError(message, status);
  }
}
