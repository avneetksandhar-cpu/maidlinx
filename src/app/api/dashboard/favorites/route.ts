import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  addFavoriteCleaner,
  getFavoriteCleaners,
  removeFavoriteCleaner,
} from "@/lib/dashboard/favorites";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { favoriteCleanerSchema } from "@/lib/validations/dashboard";

export async function GET() {
  try {
    const { profile } = await requireCustomerSession();
    const favorites = await getFavoriteCleaners(profile.id);
    return jsonSuccess({ favorites });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load favorites.";
    return jsonError(message, 401);
  }
}

export async function POST(request: Request) {
  try {
    const { profile } = await requireCustomerSession();
    const body = await request.json();
    const parsed = favoriteCleanerSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid request.", 400);
    }

    await addFavoriteCleaner(profile.id, parsed.data.professionalProfileId);
    return jsonSuccess({ added: true }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add favorite.";
    return jsonError(message, 400);
  }
}

export async function DELETE(request: Request) {
  try {
    const { profile } = await requireCustomerSession();
    const body = await request.json();
    const parsed = favoriteCleanerSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid request.", 400);
    }

    await removeFavoriteCleaner(profile.id, parsed.data.professionalProfileId);
    return jsonSuccess({ removed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove favorite.";
    return jsonError(message, 400);
  }
}
