import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  assertCleanerCanUpdateLiveLocation,
  upsertCleanerLiveLocation,
} from "@/lib/location/live-location";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanerLiveLocationUpdateSchema } from "@/lib/validations/live-location";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function resolveCleanerId(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cleaners")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ? String(data.id) : null;
}

function statusCodeForError(message: string): number {
  if (message.includes("do not have access")) return 403;
  if (message.includes("not found")) return 404;
  if (message.includes("only available")) return 409;
  return 400;
}

/** Cleaner portal: upsert current GPS while en route / arrived. */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { profile } = await requireProfessionalSession();
    const { id: bookingId } = await context.params;
    const body = await request.json();
    const parsed = cleanerLiveLocationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid location payload.", 400);
    }

    const cleanerId = await resolveCleanerId(profile.id);
    if (!cleanerId) {
      return jsonError("Cleaner profile not found.", 404);
    }

    await assertCleanerCanUpdateLiveLocation({
      bookingId,
      professionalProfileId: profile.id,
      cleanerId,
    });

    const location = await upsertCleanerLiveLocation({
      bookingId,
      cleanerId,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      accuracy: parsed.data.accuracy,
    });

    return jsonSuccess({
      bookingId: location.bookingId,
      cleanerId: location.cleanerId,
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      updatedAt: location.updatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update location.";
    return jsonError(message, statusCodeForError(message));
  }
}
