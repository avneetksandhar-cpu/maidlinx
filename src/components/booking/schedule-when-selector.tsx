"use client";

import { useMemo } from "react";
import { Check, Zap, Sun, CalendarDays, CalendarRange } from "lucide-react";
import { ARRIVAL_WINDOWS, type ArrivalWindowId } from "@/lib/bookings/constants";
import type { SchedulePreset } from "@/lib/bookings/booking-state";
import { resolveSchedulePreset } from "@/lib/bookings/schedule-presets";
import { suggestArrivalWindows } from "@/lib/availability/windows";
import { BookingCalendar } from "@/components/booking/booking-calendar";
import { cn } from "@/lib/utils";

const PRESETS: Array<{
  id: SchedulePreset;
  label: string;
  description: string;
  icon: typeof Zap;
}> = [
  { id: "asap", label: "ASAP", description: "First available window", icon: Zap },
  { id: "today", label: "Today", description: "Later today", icon: Sun },
  { id: "tomorrow", label: "Tomorrow", description: "Next day", icon: CalendarDays },
  { id: "date", label: "Pick a date", description: "Choose your day", icon: CalendarRange },
];

interface ScheduleWhenSelectorProps {
  /** Split booking funnel: date-only, time-only, or combined (legacy). */
  mode?: "date" | "time" | "all";
  schedulePreset?: SchedulePreset;
  date?: string;
  arrivalWindow?: string;
  marketId?: string | null;
  /** Estimated job length — feeds future supply filtering. */
  durationMinutes?: number;
  onPresetChange: (
    preset: SchedulePreset,
    resolved: { date: string; arrivalWindow: ArrivalWindowId },
  ) => void;
  onDateChange: (date: string) => void;
  onWindowChange: (window: ArrivalWindowId) => void;
  errors?: Record<string, string>;
}

export function ScheduleWhenSelector({
  mode = "all",
  schedulePreset,
  date,
  arrivalWindow,
  marketId,
  durationMinutes = 120,
  onPresetChange,
  onDateChange,
  onWindowChange,
  errors = {},
}: ScheduleWhenSelectorProps) {
  const minDate = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  const showPresets = mode === "date" || mode === "all";
  const showWindows =
    (mode === "time" || mode === "all") &&
    Boolean(schedulePreset) &&
    (mode === "time" || schedulePreset !== "asap");
  const showDatePicker = showPresets && schedulePreset === "date";

  const suggestedWindows = useMemo(() => {
    if (!date || !showWindows) return [];
    return suggestArrivalWindows({
      marketId: marketId || "UNKNOWN",
      date,
      durationMinutes,
      // V1: no live supply — architecture ready via supplyByWindow later.
    });
  }, [date, durationMinutes, marketId, showWindows]);

  const windows =
    suggestedWindows.length > 0
      ? suggestedWindows
      : ARRIVAL_WINDOWS.map((window) => ({
          id: window.id as ArrivalWindowId,
          label: window.label,
          description: window.description,
          available: true,
          supplyEstimate: null as number | null,
        }));

  return (
    <div className="space-y-6">
      {showPresets ? (
        <fieldset>
          <legend className="mb-3 block text-[15px] font-medium text-ink">
            When do you need us?
          </legend>
          <div className="grid grid-cols-2 gap-2.5">
            {PRESETS.map((preset) => {
              const selected = schedulePreset === preset.id;
              const Icon = preset.icon;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    const resolved = resolveSchedulePreset(preset.id, {
                      date,
                      arrivalWindow: arrivalWindow as ArrivalWindowId | undefined,
                    });
                    onPresetChange(preset.id, resolved);
                  }}
                  aria-pressed={selected}
                  data-selected={selected}
                  className={cn(
                    "flex min-h-[5rem] flex-col items-start gap-1.5 rounded-2xl border border-[#E2E9E6] bg-white p-4 text-left transition-all duration-200",
                    "hover:border-[#C5D2CD] hover:bg-[#F1F8F5] active:scale-[0.99]",
                    selected && "border-accent bg-[#F1F8F5] shadow-[0_0_0_1px_rgb(8_127_101_/_0.18)]",
                  )}
                >
                  <Icon
                    className={cn("size-4", selected ? "text-accent" : "text-ink")}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="text-[15px] font-semibold text-ink">{preset.label}</span>
                  <span className="text-sm text-ink-muted">{preset.description}</span>
                </button>
              );
            })}
          </div>
          {errors.schedulePreset ? (
            <p className="mt-2 text-sm text-error">{errors.schedulePreset}</p>
          ) : null}
        </fieldset>
      ) : null}

      {showDatePicker ? (
        <div>
          <p className="mb-3 text-[15px] font-medium text-ink">Preferred date</p>
          <BookingCalendar
            value={date}
            minDate={minDate}
            onChange={onDateChange}
            error={errors.date}
          />
        </div>
      ) : null}

      {showWindows ? (
        <fieldset>
          <legend className="mb-3 block text-[15px] font-medium text-ink">
            Arrival window
            <span className="ml-1 font-normal text-ink-muted">
              — preference for now
            </span>
          </legend>
          <div className="grid gap-2.5">
            {windows.map((window) => {
              const selected = arrivalWindow === window.id;
              const disabled = window.available === false;
              return (
                <button
                  key={window.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onWindowChange(window.id)}
                  aria-pressed={selected}
                  data-selected={selected}
                  className={cn(
                    "booking-select-card items-start",
                    disabled && "cursor-not-allowed opacity-45",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-ink">{window.label}</span>
                    <span className="mt-0.5 block text-sm text-ink-muted">
                      {window.description}
                      {disabled ? " · Unavailable" : ""}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150",
                      selected
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-surface text-transparent",
                    )}
                    aria-hidden
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          </div>
          {errors.arrivalWindow ? (
            <p className="mt-2 text-sm text-error">{errors.arrivalWindow}</p>
          ) : null}
        </fieldset>
      ) : null}

      {(mode === "date" || mode === "all") && schedulePreset === "asap" && date ? (
        <p className="rounded-2xl bg-[#F1F8F5] px-4 py-3.5 text-[15px] text-ink">
          We&apos;ll aim for the soonest window today
          {arrivalWindow
            ? ` (${ARRIVAL_WINDOWS.find((w) => w.id === arrivalWindow)?.label?.toLowerCase()})`
            : ""}
          .
        </p>
      ) : null}

      {mode === "time" && !date ? (
        <p className="text-[15px] text-ink-muted">Pick a day first, then choose a window.</p>
      ) : null}
    </div>
  );
}
