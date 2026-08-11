/**
 * Normalize market identifiers across config codes and DB seed ids.
 * Config uses TORONTO_GTA / SOUTH_FLORIDA / NEW_YORK / CALIFORNIA.
 */

export const OPS_MARKETS = [
  {
    key: "toronto_gta",
    label: "Toronto / GTA",
    aliases: ["TORONTO_GTA", "toronto-gta", "mkt_toronto_gta", "toronto_gta"],
  },
  {
    key: "south_florida",
    label: "Florida / South Florida",
    aliases: ["SOUTH_FLORIDA", "south-florida", "mkt_south_florida", "south_florida"],
  },
  {
    key: "new_york",
    label: "New York",
    aliases: ["NEW_YORK", "new-york", "mkt_new_york", "new_york"],
  },
  {
    key: "california",
    label: "California",
    aliases: ["CALIFORNIA", "california", "mkt_california"],
  },
] as const;

export type OpsMarketKey = (typeof OPS_MARKETS)[number]["key"];

const ALIAS_TO_KEY = new Map<string, OpsMarketKey>();
for (const market of OPS_MARKETS) {
  for (const alias of market.aliases) {
    ALIAS_TO_KEY.set(alias.toLowerCase(), market.key);
  }
}

export function normalizeOpsMarketKey(
  marketId: string | null | undefined,
): OpsMarketKey | "unassigned" {
  if (!marketId) return "unassigned";
  return ALIAS_TO_KEY.get(marketId.trim().toLowerCase()) ?? "unassigned";
}

export function opsMarketLabel(key: OpsMarketKey | "unassigned"): string {
  if (key === "unassigned") return "Unassigned";
  return OPS_MARKETS.find((m) => m.key === key)?.label ?? key;
}

export function isKnownOpsMarket(marketId: string | null | undefined): boolean {
  return normalizeOpsMarketKey(marketId) !== "unassigned";
}
