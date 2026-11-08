import { describe, expect, it } from "vitest";
import { OVERVIEW_PIN_SETTLED_KEY } from "@/components/home/overview-coastal-map";

describe("Overview coastal map pin persistence", () => {
  it("uses a namespaced localStorage key", () => {
    expect(OVERVIEW_PIN_SETTLED_KEY).toBe("maidlinx.overview.pinSettled");
  });
});
