"use client";

import { PhoneFrame } from "@/components/booking-flow/PhoneFrame";
import { PrimaryButton } from "@/components/booking-flow/PrimaryButton";
import { WingmanLogo } from "@/components/brand/WingmanLogo";
import { BottomNav } from "@/components/layout/BottomNav";
import { formatNightLabel } from "@/lib/booking-flow/dates";
import { useNightBooking } from "@/lib/booking-flow/provider";
import { formatUsd } from "@/lib/format";
import { MIN_BOOKING_CENTS } from "@/lib/marketplace/constants";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function SuccessScreen() {
  const params = useSearchParams();
  const { state, patch } = useNightBooking();
  const requestId = params.get("requestId") || state.requestId;
  const [status, setStatus] = useState(state.paymentStatus);
  const match = state.selectedMatch;

  useEffect(() => {
    if (!requestId) return;
    void fetch(`/api/requests/${requestId}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { request?: { status?: string } } | null) => {
        const next = payload?.request?.status;
        if (next === "paid" || next === "confirmed") {
          setStatus("paid");
          patch({ paymentStatus: "paid", requestId });
        }
      })
      .catch(() => undefined);
  }, [patch, requestId]);

  const night = match ? formatNightLabel(match.localDate, match.localTimeText) : "Tonight";
  const paid = status === "paid" || params.get("paid") === "1";

  function addToCalendar() {
    if (!match) return;
    const start = match.localDate.replace(/-/g, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:Wingman · ${match.venueName || match.name}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DESCRIPTION:Wingman night service. ${requestId ?? ""}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wingman-night.ics";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PhoneFrame>
      <div className="relative flex min-h-dvh flex-col bg-[#050508] pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-white">
        <div className="flex flex-1 flex-col px-6 pt-[max(48px,env(safe-area-inset-top))]">
          <WingmanLogo size={48} title="Wingman" />
          <h1 className="mt-8 text-[22px] font-medium tracking-[-0.02em]">
            {paid ? "You’re in." : "Request saved."}
          </h1>
          <p className="mt-3 text-[13px] leading-5 text-white/50">
            {match?.venueName || match?.name || "Miami"}
            <br />
            {night}
            <br />
            {formatUsd((state.confirmedOffer?.totalCents ?? MIN_BOOKING_CENTS) / 100)} night service
          </p>
          <div className="mt-10 space-y-5 text-[16px]">
            {requestId ? (
              <Link href={`/requests/${requestId}`} className="block text-white">
                Meet your Wingman
              </Link>
            ) : null}
            {requestId ? (
              <Link href={`/requests/${requestId}`} className="block text-white">
                Chat
              </Link>
            ) : null}
            {match?.area ? (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(match.area)}`} className="block text-white">
                Directions
              </a>
            ) : null}
          </div>
          <div className="mt-auto pt-8">
            <PrimaryButton onClick={addToCalendar} disabled={!match}>
              Add to calendar
            </PrimaryButton>
          </div>
        </div>
        <BottomNav />
      </div>
    </PhoneFrame>
  );
}
