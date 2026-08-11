import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  approveOrRejectCleaner,
  bulkUpdateCleaners,
  listCleaners,
  listPendingCleanerApprovals,
  updateCleanerStatus,
} from "@/lib/admin/cleaners";
import { requireAdminApiPermission } from "@/lib/admin/session";
import {
  bulkCleanerActionSchema,
  reviewCleanerOnboardingSchema,
} from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    await requireAdminApiPermission("cleaners.read");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const pending = searchParams.get("pending") === "1";
    const cleaners = pending
      ? await listPendingCleanerApprovals()
      : await listCleaners(search);
    return jsonSuccess({ cleaners });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to load cleaners.", 403);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminApiPermission("cleaners.write");
    const body = await request.json();

    if (body.decision) {
      const parsed = reviewCleanerOnboardingSchema.safeParse(body);
      if (!parsed.success) return jsonError("Invalid onboarding review.", 400);
      await approveOrRejectCleaner(
        admin.id,
        parsed.data.professionalId,
        parsed.data.decision,
        parsed.data.rejectionReason,
      );
      return jsonSuccess({ updated: true });
    }

    if (body.bulk) {
      const parsed = bulkCleanerActionSchema.safeParse(body);
      if (!parsed.success) return jsonError("Invalid bulk request.", 400);
      const count = await bulkUpdateCleaners(admin.id, parsed.data.ids, {
        isVerified: parsed.data.isVerified,
        isActive: parsed.data.isActive,
      });
      return jsonSuccess({ updated: count });
    }

    const { professionalId, isVerified, isActive } = body;
    if (!professionalId) return jsonError("professionalId required.", 400);

    await updateCleanerStatus(admin.id, professionalId, { isVerified, isActive });
    return jsonSuccess({ updated: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Update failed.", 400);
  }
}
