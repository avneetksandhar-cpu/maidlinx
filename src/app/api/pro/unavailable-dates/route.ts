import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  addUnavailableDate,
  listUnavailableDates,
  removeUnavailableDate,
} from "@/lib/cleaners/unavailable-dates";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import {
  removeUnavailableDateSchema,
  unavailableDateSchema,
} from "@/lib/validations/pro-dashboard";

export async function GET() {
  try {
    const { profile } = await requireProfessionalSession();
    const dates = await listUnavailableDates(profile.professionalId);
    return jsonSuccess({ dates });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Authentication required.", 401);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const body = await request.json();
    const parsed = unavailableDateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid date.", 400);
    }
    const date = await addUnavailableDate({
      cleanerId: profile.professionalId,
      unavailableDate: parsed.data.unavailableDate,
      reason: parsed.data.reason,
    });
    return jsonSuccess({ date });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to block date.", 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const body = await request.json();
    const parsed = removeUnavailableDateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid date.", 400);
    }
    await removeUnavailableDate(profile.professionalId, parsed.data.unavailableDate);
    return jsonSuccess({ removed: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to remove date.", 400);
  }
}
