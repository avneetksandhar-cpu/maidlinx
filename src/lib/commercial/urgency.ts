import type { DashboardBooking } from "@/lib/dashboard/bookings";
import type { CommercialProposal } from "@/lib/commercial/types";
import type { ServiceOrder } from "@/lib/commercial/types";
import { routes } from "@/config/site";

export type OverviewUrgency =
  | {
      kind: "active_visit";
      title: string;
      subtitle: string;
      href: string;
    }
  | {
      kind: "proposal_awaiting";
      title: string;
      subtitle: string;
      href: string;
    }
  | {
      kind: "next_visit";
      title: string;
      subtitle: string;
      href: string;
    }
  | {
      kind: "add_site";
      title: string;
      subtitle: string;
      href: string;
    };

const ACTIVE = new Set([
  "on_the_way",
  "arrived",
  "in_progress",
  "accepted",
  "assigned",
]);

/**
 * Returning overview: most urgent tap target.
 * Priority: active visit → proposal awaiting approval → next visit → add site.
 */
export function resolveOverviewUrgency(input: {
  siteCount: number;
  upcoming: DashboardBooking[];
  proposals: CommercialProposal[];
  orders: ServiceOrder[];
}): OverviewUrgency {
  const active = input.upcoming.find((b) => ACTIVE.has(b.status));
  if (active) {
    return {
      kind: "active_visit",
      title: "Crew status",
      subtitle: `${active.status.replaceAll("_", " ")} · ${active.addressLine1 || "Site"}`,
      href: routes.dashboardJob(active.id),
    };
  }

  const awaiting = input.proposals.find((p) =>
    ["awaiting_approval", "sent"].includes(p.status),
  );
  if (awaiting) {
    return {
      kind: "proposal_awaiting",
      title: "Proposal awaiting approval",
      subtitle: awaiting.providerName?.trim() || "Provider proposal ready",
      href: routes.dashboardSiteQuotes(awaiting.siteAddressId),
    };
  }

  const next =
    input.upcoming[0] ??
    null;
  if (next) {
    return {
      kind: "next_visit",
      title: "Next visit",
      subtitle: next.addressLine1 || "Scheduled clean",
      href: routes.dashboardJob(next.id),
    };
  }

  const activeOrder = input.orders.find((o) => o.status === "active");
  if (activeOrder) {
    return {
      kind: "next_visit",
      title: "Service order",
      subtitle: "View agreed scope and visits",
      href: `/dashboard/orders/${activeOrder.id}`,
    };
  }

  return {
    kind: "add_site",
    title: input.siteCount === 0 ? "Which site needs cleaning?" : "Clean a site",
    subtitle:
      input.siteCount === 0
        ? "Add your first South Florida office or storefront"
        : "Pick a site to scope or book",
    href: routes.dashboardSites,
  };
}
