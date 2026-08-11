import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/dashboard/notifications";
import { updateCustomerProfile } from "@/lib/profiles/repository";
import { requireCustomerSession } from "@/lib/dashboard/session";
import {
  notificationPreferencesSchema,
  updateProfileSchema,
} from "@/lib/validations/dashboard";

export async function GET() {
  try {
    const { profile } = await requireCustomerSession();
    const notifications = await getNotificationPreferences(profile.id);
    return jsonSuccess({ profile, notifications });
  } catch {
    return jsonError("Authentication required.", 401);
  }
}

export async function PATCH(request: Request) {
  try {
    const { profile } = await requireCustomerSession();
    const body = await request.json();
    const section = body.section as string;

    if (section === "profile") {
      const parsed = updateProfileSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.errors[0]?.message ?? "Invalid profile.", 400);
      }
      await updateCustomerProfile(profile.id, {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: parsed.data.phone || null,
      });
      return jsonSuccess({ updated: true });
    }

    if (section === "notifications") {
      const parsed = notificationPreferencesSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.errors[0]?.message ?? "Invalid preferences.", 400);
      }
      await updateNotificationPreferences(profile.id, parsed.data);
      return jsonSuccess({ updated: true });
    }

    return jsonError("Unknown section.", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save.";
    return jsonError(message, 400);
  }
}
