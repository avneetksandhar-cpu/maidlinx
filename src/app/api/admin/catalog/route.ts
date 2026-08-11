import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  listAdminMarkets,
  listAdminServiceZones,
  listAdminServices,
} from "@/lib/admin/catalog";
import { requireAdminApiPermission } from "@/lib/admin/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "markets";

    if (type === "services") {
      await requireAdminApiPermission("services.read");
      const services = await listAdminServices();
      return jsonSuccess({ services });
    }

    if (type === "zones") {
      await requireAdminApiPermission("markets.read");
      const zones = await listAdminServiceZones(searchParams.get("marketId") ?? undefined);
      return jsonSuccess({ zones });
    }

    await requireAdminApiPermission("markets.read");
    const markets = await listAdminMarkets();
    return jsonSuccess({ markets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load catalog.";
    const status = message.includes("denied") || message.includes("Insufficient") ? 403 : 400;
    return jsonError(message, status);
  }
}
