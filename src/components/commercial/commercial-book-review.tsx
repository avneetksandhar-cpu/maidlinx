"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckSquare } from "lucide-react";
import { CommercialCtaButton } from "@/components/commercial/commercial-book-chrome";
import { frequencyShortLabel } from "@/lib/commercial/book-draft";
import { recurringPriceBreakdown } from "@/lib/commercial/pricing-display";
import type { CommercialProposal } from "@/lib/commercial/types";
import { checklistFromAreas } from "@/lib/commercial/types";
import { routes } from "@/config/site";

interface CommercialBookReviewProps {
  proposal: CommercialProposal | null;
  siteLabel: string | null;
  serviceLabel: string | null;
  areas: string[];
  /** When no proposal — show honest empty / request path. */
  emptyReason?: string | null;
}

/**
 * Review before confirmation — checklist + visit price + recurring/monthly estimate
 * from the real proposal record. Approves via PATCH /api/commercial/proposals.
 * Stripe LIVE stays OFF (pay-after / net terms on commercial proposals).
 */
export function CommercialBookReview({
  proposal,
  siteLabel,
  serviceLabel,
  areas,
  emptyReason,
}: CommercialBookReviewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items =
    areas.length > 0
      ? checklistFromAreas(areas)
      : checklistFromAreas(["restrooms", "floors", "breakroom", "common_areas"]);

  const price = proposal
    ? recurringPriceBreakdown({
        visitCents: proposal.clientPriceCents,
        frequency: proposal.frequency,
        billingCadence: proposal.billingCadence,
      })
    : null;

  async function confirm() {
    if (!proposal) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial/proposals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.id,
          action: "approve",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        data?: { visitBookingId?: string | null; serviceOrderId?: string };
      };
      if (!res.ok) throw new Error(json.error ?? "Unable to confirm booking.");

      const bookingId = json.data?.visitBookingId;
      if (bookingId) {
        router.push(routes.dashboardBookStatus(bookingId));
        return;
      }
      if (json.data?.serviceOrderId) {
        router.push(routes.dashboardOrder(json.data.serviceOrderId));
        return;
      }
      router.push(routes.dashboardJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to confirm.");
    } finally {
      setLoading(false);
    }
  }

  if (!proposal) {
    return (
      <div className="mx-auto w-full max-w-[390px] space-y-5 lg:max-w-[430px]">
        <header className="space-y-2">
          <Link
            href={routes.dashboardBookTeams}
            className="inline-flex text-sm font-semibold text-[#04CED2]"
          >
            ← Teams
          </Link>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-white">
            Review booking
          </h1>
        </header>
        <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--ml-dark-surface)] px-4 py-8 text-center">
          <p className="text-sm font-semibold text-white">Nothing to review yet</p>
          <p className="mt-1.5 text-sm text-[var(--ml-dark-ink-muted)]">
            {emptyReason ??
              "Select a real cleaning team proposal before confirming. No sample pricing."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[390px] space-y-5 lg:max-w-[430px]">
      <header className="space-y-2">
        <Link
          href={routes.dashboardBookTeams}
          className="inline-flex text-sm font-semibold text-[#04CED2]"
        >
          ← Teams
        </Link>
        <h1 className="text-[1.75rem] font-bold tracking-tight text-white">
          Review booking
        </h1>
        <p className="text-sm text-[var(--ml-dark-ink-muted)]">
          {[frequencyShortLabel(proposal.frequency), siteLabel].filter(Boolean).join(" · ")}
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-[var(--ml-dark-surface)] px-4 py-4">
        <p className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">
          Cleaning team
        </p>
        <p className="mt-1 text-[16px] font-semibold text-white">
          {proposal.providerName?.trim() || "Commercial provider"}
        </p>
        {serviceLabel ? (
          <p className="mt-1 text-sm text-white/60">{serviceLabel}</p>
        ) : null}
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-[var(--ml-dark-surface)] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">
            Cleaning checklist
          </p>
          <Link
            href={`${routes.dashboardBookChecklist}?proposal=${encodeURIComponent(proposal.id)}`}
            className="text-sm font-semibold text-[#04CED2]"
          >
            View full
          </Link>
        </div>
        <ul className="space-y-2">
          {items.slice(0, 6).map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm text-white">
              <CheckSquare className="size-4 shrink-0 text-[#04CED2]" aria-hidden />
              {item.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[#04CED2]/40 bg-[var(--ml-dark-surface)] px-4 py-4">
        <p className="text-[11px] font-semibold tracking-wide text-white/55 uppercase">
          Pricing
        </p>
        <p className="mt-2 text-[1.35rem] font-bold tabular-nums text-white">
          {price?.visitLabel}
        </p>
        <p className="mt-1 text-sm text-white/65">{price?.cadenceLabel}</p>
        {price?.monthlyLabel ? (
          <p className="mt-2 text-[15px] font-semibold text-[#04CED2]">
            {price.monthlyLabel}
          </p>
        ) : proposal.frequency === "one_time" ? (
          <p className="mt-2 text-sm text-white/55">One-time visit — no monthly estimate.</p>
        ) : (
          <p className="mt-2 text-sm text-white/55">
            Monthly estimate unavailable until visit price is set on the proposal.
          </p>
        )}
        <p className="mt-3 text-xs text-[var(--ml-dark-ink-muted)]">
          Stripe LIVE is OFF. Commercial confirmation creates a service order / first
          visit from this proposal — payment follows proposal terms (
          {proposal.paymentExpected.replaceAll("_", " ")}).
        </p>
      </section>

      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <CommercialCtaButton
        disabled={loading || !["sent", "awaiting_approval", "approved"].includes(proposal.status)}
        onClick={() => void confirm()}
      >
        {loading
          ? "Confirming…"
          : proposal.status === "approved"
            ? "Open confirmed job"
            : "Confirm booking"}
      </CommercialCtaButton>
    </div>
  );
}
