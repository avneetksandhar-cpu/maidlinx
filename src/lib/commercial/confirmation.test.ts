import { describe, expect, it } from "vitest";
import {
  afterHoursArrivalWindow,
  getCommercialConfirmationView,
  isCommercialPaymentVerified,
  isCommercialTeamReserved,
} from "@/lib/commercial/confirmation";

describe("commercial confirmation", () => {
  it("stays confirming until payment verified AND team reserved", () => {
    const view = getCommercialConfirmationView({
      status: "awaiting_assignment",
      paymentStatus: "pending",
      professionalProfileId: null,
      cleanerId: null,
      serviceOrderId: "so_1",
      isCommercial: true,
      totalCents: 25000,
      frequency: "weekly",
      billingCadence: "per_visit",
      dueNowCents: 0,
      scheduledAt: "2026-11-10T18:00:00.000Z",
      arrivalWindowStart: "2026-11-10T18:00:00.000Z",
      arrivalWindowEnd: "2026-11-10T20:00:00.000Z",
    });
    expect(view.phase).toBe("confirming");
    expect(view.headline).toBe("Confirming your booking");
    expect(view.paymentVerified).toBe(true);
    expect(view.teamReserved).toBe(false);
  });

  it("confirms when order exists and team is assigned", () => {
    const view = getCommercialConfirmationView({
      status: "assigned",
      paymentStatus: "pending",
      professionalProfileId: "pro_1",
      cleanerId: "cl_1",
      serviceOrderId: "so_1",
      isCommercial: true,
      totalCents: 25000,
      frequency: "weekly",
      billingCadence: "net30",
      dueNowCents: 0,
      scheduledAt: "2026-11-10T18:00:00.000Z",
      arrivalWindowStart: "2026-11-10T18:00:00.000Z",
      arrivalWindowEnd: "2026-11-10T20:00:00.000Z",
      nextVisitAt: "2026-11-17T18:00:00.000Z",
    });
    expect(view.phase).toBe("confirmed");
    expect(view.headline).toBe("Booking confirmed");
    expect(view.showCrewOnTheWay).toBe(false);
    expect(view.crewHeadline).toMatch(/Scheduled/);
    expect(view.amountPaidTodayCents).toBe(0);
    expect(view.pricePerVisitLabel).toMatch(/visit/);
    expect(view.nextVisitAt).toBe("2026-11-17T18:00:00.000Z");
  });

  it("shows Crew on the way only after real on_the_way status", () => {
    const before = getCommercialConfirmationView({
      status: "accepted",
      paymentStatus: "pending",
      professionalProfileId: "pro_1",
      serviceOrderId: "so_1",
      isCommercial: true,
      totalCents: 10000,
      scheduledAt: "2026-11-10T18:00:00.000Z",
    });
    expect(before.showCrewOnTheWay).toBe(false);

    const live = getCommercialConfirmationView({
      status: "on_the_way",
      paymentStatus: "pending",
      professionalProfileId: "pro_1",
      serviceOrderId: "so_1",
      isCommercial: true,
      totalCents: 10000,
      scheduledAt: "2026-11-10T18:00:00.000Z",
      arrivalWindowStart: "2026-11-10T18:00:00.000Z",
      arrivalWindowEnd: "2026-11-10T20:00:00.000Z",
    });
    expect(live.showCrewOnTheWay).toBe(true);
    expect(live.showLiveMapEligible).toBe(true);
  });

  it("hides next visit for one_time frequency", () => {
    const view = getCommercialConfirmationView({
      status: "assigned",
      paymentStatus: "pending",
      professionalProfileId: "pro_1",
      serviceOrderId: "so_1",
      isCommercial: true,
      totalCents: 10000,
      frequency: "one_time",
      nextVisitAt: "2026-11-17T18:00:00.000Z",
      scheduledAt: "2026-11-10T18:00:00.000Z",
    });
    expect(view.nextVisitAt).toBeNull();
  });

  it("rejects payment verify without service order", () => {
    expect(
      isCommercialPaymentVerified({
        status: "assigned",
        paymentStatus: "pending",
        serviceOrderId: null,
        isCommercial: true,
      }),
    ).toBe(false);
  });

  it("treats professional_profile_id as team reserved", () => {
    expect(
      isCommercialTeamReserved({
        status: "awaiting_assignment",
        professionalProfileId: "pro_1",
        cleanerId: null,
      }),
    ).toBe(true);
  });

  it("builds after-hours timestamptz windows", () => {
    const window = afterHoursArrivalWindow("2026-11-10T12:00:00.000Z");
    const start = new Date(window.start);
    const end = new Date(window.end);
    expect(start.getHours()).toBe(18);
    expect(end.getHours()).toBe(20);
  });
});
