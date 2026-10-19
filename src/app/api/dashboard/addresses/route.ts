import { getSession } from "@/lib/auth/session";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  createSavedAddress,
  getRecentBookingAddress,
  listSavedAddresses,
} from "@/lib/dashboard/addresses";
import { hasAdminEnv } from "@/lib/supabase/admin";
import { savedAddressSchema } from "@/lib/validations/dashboard";

async function requireCustomerUser() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Authentication required.");
  }
  const role = session.profile?.role ?? "customer";
  if (role !== "customer" && role !== "admin") {
    throw new Error("Authentication required.");
  }
  return {
    userId: session.profile?.id ?? session.user.id,
    email: session.user.email,
  };
}

export async function GET() {
  try {
    if (!hasAdminEnv()) {
      return jsonSuccess({ addresses: [], recent: null });
    }

    const { userId, email } = await requireCustomerUser();
    const [addresses, recent] = await Promise.all([
      listSavedAddresses(userId),
      getRecentBookingAddress(userId, email),
    ]);

    return jsonSuccess({ addresses, recent });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load addresses.";
    return jsonError(message, message.includes("Authentication") ? 401 : 500);
  }
}

export async function POST(request: Request) {
  try {
    if (!hasAdminEnv()) {
      return jsonError("Saved addresses are temporarily unavailable. Please try again shortly.", 503);
    }

    const { userId } = await requireCustomerUser();
    const body = await request.json();
    const parsed = savedAddressSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid address.", 400);
    }

    const address = await createSavedAddress(userId, {
      ...parsed.data,
      country: parsed.data.countryCode ?? parsed.data.country ?? "US",
      countryCode: parsed.data.countryCode ?? parsed.data.country ?? "US",
    });

    return jsonSuccess({ address }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save address.";
    return jsonError(message, message.includes("Authentication") ? 401 : 400);
  }
}
