import { describe, expect, it } from "vitest";
import {
  normalizeOpsMarketKey,
  opsMarketLabel,
  isKnownOpsMarket,
} from "@/lib/admin/market-ids";

describe("ops market ids", () => {
  it("normalizes config and DB aliases to Toronto / GTA", () => {
    expect(normalizeOpsMarketKey("TORONTO_GTA")).toBe("toronto_gta");
    expect(normalizeOpsMarketKey("mkt_toronto_gta")).toBe("toronto_gta");
    expect(normalizeOpsMarketKey("toronto-gta")).toBe("toronto_gta");
    expect(opsMarketLabel("toronto_gta")).toBe("Toronto / GTA");
  });

  it("normalizes South Florida aliases", () => {
    expect(normalizeOpsMarketKey("SOUTH_FLORIDA")).toBe("south_florida");
    expect(normalizeOpsMarketKey("mkt_south_florida")).toBe("south_florida");
    expect(isKnownOpsMarket("mkt_south_florida")).toBe(true);
    expect(opsMarketLabel("south_florida")).toBe("Florida / South Florida");
  });

  it("normalizes New York and California aliases", () => {
    expect(normalizeOpsMarketKey("NEW_YORK")).toBe("new_york");
    expect(normalizeOpsMarketKey("new-york")).toBe("new_york");
    expect(normalizeOpsMarketKey("CALIFORNIA")).toBe("california");
    expect(opsMarketLabel("california")).toBe("California");
    expect(isKnownOpsMarket("CALIFORNIA")).toBe(true);
  });

  it("maps unknown markets to unassigned", () => {
    expect(normalizeOpsMarketKey(null)).toBe("unassigned");
    expect(normalizeOpsMarketKey("vancouver")).toBe("unassigned");
    expect(opsMarketLabel("unassigned")).toBe("Unassigned");
  });
});
