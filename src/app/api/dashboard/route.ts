import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getCustomerBookings, getInvoices, getReceipts } from "@/lib/dashboard/bookings";
import { getFavoriteCleaners } from "@/lib/dashboard/favorites";
import { getNotificationPreferences } from "@/lib/dashboard/notifications";
import { requireCustomerSession } from "@/lib/dashboard/session";

export async function GET() {
  try {
    const { profile, email } = await requireCustomerSession();

    const [upcoming, past, invoices, receipts, favorites, notifications] = await Promise.all([
      getCustomerBookings(profile.id, email, "upcoming"),
      getCustomerBookings(profile.id, email, "past"),
      getInvoices(profile.id, email),
      getReceipts(profile.id, email),
      getFavoriteCleaners(profile.id),
      getNotificationPreferences(profile.id),
    ]);

    return jsonSuccess({
      profile,
      upcoming,
      past,
      invoices,
      receipts,
      favorites,
      notifications,
      counts: {
        upcoming: upcoming.length,
        past: past.length,
        invoices: invoices.length,
        receipts: receipts.length,
        favorites: favorites.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load dashboard.";
    const status = message === "Authentication required." ? 401 : 500;
    return jsonError(message, status);
  }
}
