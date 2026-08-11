import { describe, expect, it } from "vitest";
import { buildBookingExtraRows } from "@/lib/bookings/repository";

describe("buildBookingExtraRows", () => {
  const bookingId = "550e8400-e29b-41d4-a716-446655440000";

  it("maps extras to priced line items", () => {
    const rows = buildBookingExtraRows(bookingId, ["inside_fridge", "laundry"]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      booking_id: bookingId,
      extra_key: "inside_fridge",
      label: "Inside fridge",
      quantity: 1,
      unit_price_cents: 2500,
      total_cents: 2500,
    });
    expect(rows[1]).toEqual({
      booking_id: bookingId,
      extra_key: "laundry",
      label: "Laundry",
      quantity: 1,
      unit_price_cents: 2000,
      total_cents: 2000,
    });
  });

  it("returns an empty array when no extras are selected", () => {
    expect(buildBookingExtraRows(bookingId, [])).toEqual([]);
  });
});
