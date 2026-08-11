import { jsonError, jsonSuccess } from "@/lib/api/response";
import { createRefund, listRefunds, processRefund } from "@/lib/admin/refunds";
import { requireAdminApiPermission } from "@/lib/admin/session";
import { createRefundSchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    await requireAdminApiPermission("refunds.write");
    const status = new URL(request.url).searchParams.get("status") ?? undefined;
    const refunds = await listRefunds(status ?? undefined);
    return jsonSuccess({ refunds });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load refunds.", 403);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApiPermission("refunds.write");
    const body = await request.json();

    if (body.action === "process" && body.id) {
      await processRefund(admin.id, body.id);
      return jsonSuccess({ processed: true });
    }

    const parsed = createRefundSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid refund.", 400);

    const refund = await createRefund(admin.id, parsed.data);
    return jsonSuccess({ refund }, 201);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Action failed.", 400);
  }
}
