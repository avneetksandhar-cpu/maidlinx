import { getSession } from "@/lib/auth/session";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  deleteSavedAddress,
  setDefaultSavedAddress,
  updateSavedAddress,
} from "@/lib/dashboard/addresses";
import { hasAdminEnv } from "@/lib/supabase/admin";
import { updateSavedAddressSchema } from "@/lib/validations/dashboard";

async function requireCustomerUser() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Authentication required.");
  }
  const role = session.profile?.role ?? "customer";
  if (role !== "customer" && role !== "admin") {
    throw new Error("Authentication required.");
  }
  return session.profile?.id ?? session.user.id;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!hasAdminEnv()) {
      return jsonError("Address storage is not configured.", 503);
    }

    const userId = await requireCustomerUser();
    const { id } = await context.params;
    const body = await request.json();

    if (body?.setDefault === true) {
      const address = await setDefaultSavedAddress(userId, id);
      return jsonSuccess({ address });
    }

    const parsed = updateSavedAddressSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid address.", 400);
    }

    const address = await updateSavedAddress(userId, id, {
      ...parsed.data,
      country: parsed.data.countryCode ?? parsed.data.country,
      countryCode: parsed.data.countryCode ?? parsed.data.country,
    });

    return jsonSuccess({ address });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update address.";
    const status = message.includes("Authentication")
      ? 401
      : message.includes("access")
        ? 403
        : message.includes("not found")
          ? 404
          : 400;
    return jsonError(message, status);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!hasAdminEnv()) {
      return jsonError("Address storage is not configured.", 503);
    }

    const userId = await requireCustomerUser();
    const { id } = await context.params;
    await deleteSavedAddress(userId, id);
    return jsonSuccess({ removed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete address.";
    const status = message.includes("Authentication")
      ? 401
      : message.includes("access")
        ? 403
        : message.includes("not found")
          ? 404
          : 400;
    return jsonError(message, status);
  }
}
