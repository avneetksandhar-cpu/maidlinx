import { getMarketById } from "@/config/markets";
import { resolveServiceArea } from "@/lib/service-area";

export function resolveServiceAreaCurrency(input: {
  marketId?: string | null;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
}): "CAD" | "USD" | null {
  if (input.marketId) {
    const market = getMarketById(input.marketId);
    if (market?.currency) return market.currency;
  }
  const area = resolveServiceArea({
    postalCode: input.postalCode,
    city: input.city,
    state: input.state,
    country: input.country,
  });
  return area.currency ?? null;
}
