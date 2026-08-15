import { z } from "zod";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { requireAdminApiPermission } from "@/lib/admin/session";
import {
  loadOwnerCleanerOps,
  saveOwnerCleanerOps,
} from "@/lib/owner/cleaner-ops";
import { ARRIVAL_WINDOWS } from "@/lib/bookings/constants";

const windowIds = ARRIVAL_WINDOWS.map((w) => w.id) as [string, ...string[]];

const PutSchema = z.object({
  marketId: z.enum(["TORONTO_GTA", "SOUTH_FLORIDA"]),
  serviceIds: z.array(z.string()).max(50),
  zoneIds: z.array(z.string()).max(50),
  hasVehicle: z.boolean().optional(),
  travelRadiusKm: z.coerce.number().min(5).max(100).nullable().optional(),
  isOnline: z.boolean().optional(),
  slots: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        arrivalWindow: z.enum(windowIds as ["morning", "afternoon", "evening"]),
        isAvailable: z.boolean(),
      }),
    )
    .optional(),
  unavailableDates: z
    .array(
      z.object({
        unavailableDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        reason: z.string().trim().max(200).optional().nullable(),
      }),
    )
    .max(90)
    .optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ cleanerId: string }> },
) {
  try {
    await requireAdminApiPermission("cleaners.read");
    const { cleanerId } = await context.params;
    const snap = await loadOwnerCleanerOps(cleanerId);
    if (!snap) return jsonError("Cleaner not found.", 404);
    return jsonSuccess({ cleaner: snap });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to load cleaner.",
      403,
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ cleanerId: string }> },
) {
  try {
    const admin = await requireAdminApiPermission("cleaners.write");
    const { cleanerId } = await context.params;
    const body = PutSchema.safeParse(await request.json());
    if (!body.success) {
      return jsonError(body.error.errors[0]?.message ?? "Invalid payload.", 400);
    }
    if (body.data.serviceIds.length === 0) {
      return jsonError("Select at least one service.", 400);
    }
    if (body.data.zoneIds.length === 0) {
      return jsonError("Select at least one service zone.", 400);
    }

    const cleaner = await saveOwnerCleanerOps({
      adminProfileId: admin.id,
      cleanerId,
      ...body.data,
    });
    return jsonSuccess({ cleaner });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to save cleaner ops.",
      400,
    );
  }
}
