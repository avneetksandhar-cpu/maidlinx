"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerMarketHeader } from "@/components/customer/customer-market-header";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { BookingsEmptyUpcoming } from "@/components/customer/bookings/bookings-empty-upcoming";
import { LaterVisitRow } from "@/components/customer/bookings/later-visit-row";
import { NextCleanCard } from "@/components/customer/bookings/next-clean-card";
import { PastBookingCard } from "@/components/customer/bookings/past-booking-card";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import { laterSectionTitle } from "@/lib/dashboard/booking-labels";
import type { SavedAddress } from "@/lib/addresses/types";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

export type BookingsTab = "upcoming" | "past";

const SCROLL_KEY = "maidlinx.bookings.scroll";
const TAB_KEY = "maidlinx.bookings.tab";

export function saveBookingsListPosition(tab: BookingsTab, scrollY: number) {
  try {
    sessionStorage.setItem(TAB_KEY, tab);
    sessionStorage.setItem(SCROLL_KEY, String(Math.max(0, Math.round(scrollY))));
  } catch {
    /* private mode */
  }
}

export function readSavedBookingsTab(): BookingsTab | null {
  try {
    const t = sessionStorage.getItem(TAB_KEY);
    return t === "past" || t === "upcoming" ? t : null;
  } catch {
    return null;
  }
}

export function BookingsListScreen({
  upcoming,
  past,
  sites,
  loadError = null,
  initialTab = "upcoming",
}: {
  upcoming: DashboardBooking[];
  past: DashboardBooking[];
  sites: SavedAddress[];
  loadError?: string | null;
  initialTab?: BookingsTab;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const restoredRef = useRef(false);

  const tabFromUrl = searchParams.get("tab");
  const tab: BookingsTab =
    tabFromUrl === "past" || tabFromUrl === "upcoming"
      ? tabFromUrl
      : initialTab;

  const nextClean = upcoming[0] ?? null;
  const later = useMemo(() => upcoming.slice(1), [upcoming]);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const savedTab = sessionStorage.getItem(TAB_KEY);
      const savedScroll = Number(sessionStorage.getItem(SCROLL_KEY) || "");
      if (
        (savedTab === "upcoming" || savedTab === "past") &&
        savedTab !== tab &&
        !tabFromUrl
      ) {
        router.replace(`${routes.dashboardBookings}?tab=${savedTab}`, { scroll: false });
        return;
      }
      if (Number.isFinite(savedScroll) && savedScroll > 0) {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: savedScroll, behavior: "instant" as ScrollBehavior });
        });
      }
    } catch {
      /* ignore */
    }
  }, [router, tab, tabFromUrl]);

  function setTab(next: BookingsTab) {
    saveBookingsListPosition(next, 0);
    router.replace(`${routes.dashboardBookings}?tab=${next}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }

  function detailHref(bookingId: string) {
    return `${routes.dashboardBooking(bookingId)}?from=${tab}`;
  }

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-x-hidden bg-white text-[#01193D]"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <CustomerMarketHeader homeHref={routes.home} />

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-5">
        <h1 className="text-[1.85rem] font-bold tracking-tight text-[#01193D]">Bookings</h1>

        <div
          className="mt-4 grid grid-cols-2 gap-1 rounded-full border border-[#E2E8EE] bg-[#F4F7FA] p-1"
          role="tablist"
          aria-label="Booking history"
        >
          <TabButton active={tab === "upcoming"} onClick={() => setTab("upcoming")}>
            Upcoming
          </TabButton>
          <TabButton active={tab === "past"} onClick={() => setTab("past")}>
            Past
          </TabButton>
        </div>

        {loadError ? (
          <div
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center"
            role="alert"
          >
            <p className="text-[15px] font-semibold text-red-800">Couldn’t load bookings</p>
            <p className="mt-1.5 text-sm text-red-700/80">{loadError}</p>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#04CED2] px-5 text-[14px] font-semibold text-[#01193D]"
            >
              Try again
            </button>
          </div>
        ) : tab === "upcoming" ? (
          <div className="mt-5 flex flex-1 flex-col">
            {!nextClean ? (
              <BookingsEmptyUpcoming />
            ) : (
              <div className="space-y-6">
                <section aria-labelledby="next-clean-heading">
                  <h2
                    id="next-clean-heading"
                    className="mb-2.5 text-[13px] font-semibold tracking-wide text-[#01193D]/55 uppercase"
                  >
                    Next clean
                  </h2>
                  <div
                    onClickCapture={() =>
                      saveBookingsListPosition(tab, window.scrollY)
                    }
                  >
                    <NextCleanCard
                      booking={nextClean}
                      sites={sites}
                      detailHref={detailHref(nextClean.id)}
                    />
                  </div>
                </section>

                {later.length > 0 ? (
                  <section aria-labelledby="later-heading">
                    <h2
                      id="later-heading"
                      className="mb-2.5 text-[13px] font-semibold tracking-wide text-[#01193D]/55 uppercase"
                    >
                      {laterSectionTitle(later[0]!.scheduledAt)}
                    </h2>
                    <ul className="space-y-2.5">
                      {later.map((booking) => (
                        <li
                          key={booking.id}
                          onClickCapture={() =>
                            saveBookingsListPosition(tab, window.scrollY)
                          }
                        >
                          <LaterVisitRow
                            booking={booking}
                            sites={sites}
                            detailHref={detailHref(booking.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 flex flex-1 flex-col">
            {past.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
                <p className="text-[1.05rem] font-bold text-[#01193D]">No past cleans yet</p>
                <p className="mt-1.5 max-w-xs text-sm text-[#5A6578]">
                  Completed and cancelled visits will show up here.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {past.map((booking) => (
                  <li
                    key={booking.id}
                    onClickCapture={() => saveBookingsListPosition(tab, window.scrollY)}
                  >
                    <PastBookingCard
                      booking={booking}
                      sites={sites}
                      detailHref={detailHref(booking.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      <CustomerBottomNav />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-full text-[14px] font-semibold transition-colors",
        active
          ? "bg-[#04CED2] text-[#01193D] shadow-sm"
          : "bg-transparent text-[#5A6578]",
      )}
    >
      {children}
    </button>
  );
}
