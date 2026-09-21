"use client";

import { LockIcon, VisaMark } from "@/components/icons";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { SampleMark } from "@/components/ui/SampleMark";
import {
  BOOKING_STATUS_COPY,
  BUDGET_LABELS,
  OCCASION_LABELS,
  TASTE_LABELS,
  createBookingRef,
  defaultEveningPlan,
  formatPlanDate,
  getBookingByRef,
  getServiceFee,
  loadEveningPlan,
  saveBooking,
  saveDraft,
  type BookingDraft,
  type BookingSource,
  type BookingStatus,
  type EveningPlan,
  type StoredBooking,
} from "@/features/booking/storage";
import { assignedWingman } from "@/features/home/data/concierge";
import { getExperience } from "@/features/home/data/experiences";
import { getPromoter } from "@/features/promoters/data/promoters";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const STEPS = [
  { id: "request", label: "Request" },
  { id: "received", label: "Received" },
  { id: "available", label: "Available" },
  { id: "pay", label: "Pay" },
] as const;

function stepForStatus(status?: BookingStatus) {
  if (status === "confirmed") return 3;
  if (status === "availability_confirmed") return 2;
  if (status === "request_received") return 1;
  return 0;
}

export function BookingFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const experienceId = params.get("experienceId") ?? undefined;
  const promoterId = params.get("promoterId") ?? undefined;
  const fromPlan = params.get("from") === "plan";
  const resumeRef = params.get("ref") ?? undefined;

  const [resumed, setResumed] = useState<StoredBooking | undefined>();
  const [plan, setPlan] = useState<EveningPlan>(defaultEveningPlan);
  const [step, setStep] = useState(0);
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState("");
  const [booking, setBooking] = useState<StoredBooking | undefined>();
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const existing = resumeRef ? getBookingByRef(resumeRef) : undefined;
    const nextPlan = loadEveningPlan() ?? defaultEveningPlan();
    setResumed(existing);
    setPlan(nextPlan);
    if (existing?.status === "confirmed") {
      router.replace(`/booking/status?ref=${existing.ref}`);
      return;
    }
    if (existing) {
      setStep(stepForStatus(existing.status));
      setGuests(existing.guests);
      setBooking(existing);
    } else {
      setGuests(nextPlan.guests);
    }
  }, [resumeRef, router]);

  const experience = getExperience(experienceId ?? resumed?.experienceId ?? "");
  const promoter = promoterId ? getPromoter(promoterId) : undefined;

  const source: BookingSource = promoter
    ? "promoter"
    : fromPlan || !experience
      ? "plan"
      : "experience";

  const title =
    resumed?.title ??
    (experience ? experience.title : `An evening — ${OCCASION_LABELS[plan.occasion]}`);
  const venue = resumed?.venue ?? experience?.location ?? "Miami";
  const dateLabel = resumed?.dateLabel ?? formatPlanDate(plan.date);
  const timeLabel = resumed?.timeLabel ?? experience?.timeLabel ?? "Time set after confirmation";
  const imageUrl = experience?.imageUrl ?? promoter?.photoUrl;
  const imageAlt = experience?.imageAlt ?? promoter?.photoAlt ?? title;

  const sampleUnit = experience?.priceFrom ?? 100;
  const subtotal = sampleUnit * guests;
  const serviceFee = getServiceFee(subtotal);
  const total = subtotal + serviceFee;

  const draft: BookingDraft = useMemo(
    () => ({
      source,
      experienceId: experience?.id,
      promoterId: promoter?.id,
      guests,
      specialRequests,
      plan,
    }),
    [experience?.id, guests, plan, promoter?.id, source, specialRequests],
  );

  function persist(next: StoredBooking) {
    saveDraft(draft);
    saveBooking(next);
    setBooking(next);
  }

  function sendRequest() {
    const ref = booking?.ref ?? createBookingRef();
    const next: StoredBooking = {
      id: ref,
      ref,
      experienceId: experience?.id,
      promoterId: promoter?.id,
      title,
      venue,
      dateLabel,
      timeLabel,
      guests,
      subtotal,
      serviceFee,
      total,
      createdAt: booking?.createdAt ?? new Date().toISOString(),
      status: "request_received",
      source,
      contactName: `${assignedWingman.firstName} · Wingman`,
      contactDetail: assignedWingman.contactNote,
    };
    persist(next);
    setStep(1);
  }

  function confirmAvailability() {
    if (!booking) return;
    persist({
      ...booking,
      guests,
      subtotal,
      serviceFee,
      total,
      status: "availability_confirmed",
    });
    setStep(2);
  }

  function goToPayment() {
    setStep(3);
  }

  async function pay() {
    if (!booking) return;
    setPaying(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    persist({
      ...booking,
      guests,
      subtotal,
      serviceFee,
      total,
      status: "confirmed",
      arrivalNote: assignedWingman.arrivalNote,
    });
    router.push(`/booking/status?ref=${booking.ref}`);
  }

  return (
    <AppShell showNav>
      <AppHeader title="Evening request" showBack backHref="/home" />

      <ol className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((item, index) => {
          const active = index <= step;
          return (
            <li key={item.id} className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "h-1 w-full rounded-full",
                  active ? "bg-cobalt" : "bg-border-subtle",
                )}
              />
              <span
                className={cn(
                  "text-[10px] uppercase tracking-[0.12em]",
                  active ? "text-ink" : "text-ink-subtle",
                )}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      {step === 0 ? (
        <section>
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {imageUrl ? (
              <div className="relative h-36 w-full">
                <Image src={imageUrl} alt={imageAlt} fill className="object-cover" sizes="430px" />
              </div>
            ) : null}
            <div className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <SampleMark>Sample plan</SampleMark>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                  {source === "plan" ? "From your evening" : "Sample idea"}
                </p>
              </div>
              <h2 className="mt-2 text-2xl text-ink">{title}</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {venue} · {dateLabel}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{timeLabel}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {OCCASION_LABELS[plan.occasion]} · {plan.tastes.map((t) => TASTE_LABELS[t]).join(", ")} ·{" "}
                {BUDGET_LABELS[plan.budget]}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-4">
            <div>
              <p className="text-sm font-medium text-ink">Guests</p>
              <p className="text-xs text-ink-muted">This is still only a request</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Decrease guests"
                onClick={() => setGuests((value) => Math.max(1, value - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-lg text-ink"
              >
                −
              </button>
              <span className="w-6 text-center text-lg font-semibold text-ink">{guests}</span>
              <button
                type="button"
                aria-label="Increase guests"
                onClick={() => setGuests((value) => Math.min(12, value + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-cobalt text-lg text-ink"
              >
                +
              </button>
            </div>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-medium text-ink">Notes for your Wingman</span>
            <textarea
              value={specialRequests}
              onChange={(event) => setSpecialRequests(event.target.value)}
              rows={4}
              placeholder="Allergies, a celebration, music you like, or a quieter table…"
              className="mt-2 w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-subtle focus:border-accent/50 focus:outline-none"
            />
          </label>

          <p className="mt-5 text-sm leading-relaxed text-ink-muted">
            Sending this tells {assignedWingman.firstName} what you want. It does not hold a table,
            a boat, or a room.
          </p>
          <Button size="lg" fullWidth className="mt-4" onClick={sendRequest}>
            Send request
          </Button>
        </section>
      ) : null}

      {step === 1 ? (
        <section>
          <p className="text-label text-accent">{BOOKING_STATUS_COPY.request_received.label}</p>
          <h2 className="mt-2 text-2xl text-ink">We have your request</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {assignedWingman.firstName} is the person handling this evening.{" "}
            <strong className="font-medium text-ink">This is not a reservation.</strong> Nothing is
            held until availability is confirmed and you pay.
          </p>
          <dl className="mt-5 space-y-2 rounded-2xl border border-border bg-surface p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Plan</dt>
              <dd className="text-right text-ink">{title}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">When</dt>
              <dd className="text-right text-ink">{dateLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Guests</dt>
              <dd className="text-right text-ink">{guests}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Reference</dt>
              <dd className="text-right text-ink">{booking?.ref}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-ink-subtle">
            This demo confirms sample availability on the next step. It does not check a live venue.
          </p>
          <Button size="lg" fullWidth className="mt-6" onClick={confirmAvailability}>
            Check sample availability
          </Button>
        </section>
      ) : null}

      {step === 2 ? (
        <section>
          <p className="text-label text-accent">{BOOKING_STATUS_COPY.availability_confirmed.label}</p>
          <h2 className="mt-2 text-2xl text-ink">This time looks open</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Sample availability only. <strong className="font-medium text-ink">It is not secured.</strong>{" "}
            Payment is next. If you stop here, you still do not have a reservation.
          </p>

          <div className="mt-5 space-y-3 rounded-2xl border border-border bg-surface p-4 text-sm leading-relaxed text-ink-muted">
            <p>
              <span className="font-medium text-ink">Included (sample):</span> planning through{" "}
              {assignedWingman.firstName}, the evening as described, and a meeting note after you
              pay.
            </p>
            <p>
              <span className="font-medium text-ink">Fees (sample):</span> a 20% service line is
              shown for the UI. Amounts are not live prices.
            </p>
            <p>
              <span className="font-medium text-ink">Cancellation:</span> because payment is not
              live, there is nothing to refund in this demo. A real policy will be written before
              charges exist.
            </p>
            <p>
              <span className="font-medium text-ink">If something goes wrong:</span>{" "}
              {assignedWingman.firstName} is your contact — not the venue, and not a public list of
              other guests.
            </p>
            <p className="text-xs text-ink-subtle">
              A $500 minimum has been discussed and is not applied here. These figures are not a
              deposit or a membership fee.
            </p>
          </div>

          <Button size="lg" fullWidth className="mt-6" onClick={goToPayment}>
            Continue to payment
          </Button>
        </section>
      ) : null}

      {step === 3 ? (
        <section>
          <h2 className="text-2xl text-ink">Payment</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Stripe is not live. Completing this step only marks the demo booking as confirmed. No
            card is charged.
          </p>

          <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <h3 className="text-[11px] uppercase tracking-[0.16em] text-ink-subtle">
              Sample total
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-ink-muted">
                <dt>Evening (sample)</dt>
                <dd className="text-ink">{formatUsd(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-ink-muted">
                <dt>Service (sample)</dt>
                <dd className="text-ink">{formatUsd(serviceFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-ink">
                <dt>Total shown</dt>
                <dd>{formatUsd(total)} USD</dd>
              </div>
            </dl>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-surface p-4">
            <h3 className="text-[11px] uppercase tracking-[0.16em] text-ink-subtle">
              Demo card
            </h3>
            <div className="mt-3 flex items-center gap-3">
              <VisaMark />
              <span className="text-sm text-ink">•••• 4242</span>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-ink-subtle">
            Inclusions, fees, cancellation, and who handles problems were shown before this step.
            Privacy stays on by default — no public spend or guest list.
          </p>

          <Button size="lg" fullWidth className="mt-6" loading={paying} onClick={() => void pay()}>
            Complete demo payment
          </Button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-subtle">
            <LockIcon />
            Mock checkout — Stripe is not live
          </p>
        </section>
      ) : null}
    </AppShell>
  );
}
