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
  const showDatePicker =
    (showPresets && schedulePreset === "date") ||
    (mode === "date" && Boolean(schedulePreset));

  const suggestedWindows = useMemo(() => {
    if (!date || !showWindows) return [];
    return suggestArrivalWindows({
      marketId: marketId || "UNKNOWN",
      date,
      durationMinutes,
      // V1: no invented supply — architecture ready via supplyByWindow later.
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
          <legend className="mb-3 block text-[15px] font-medium text-[var(--ml-dark-ink)]">
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
                    "flex min-h-[5rem] flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all duration-200",
                    "hover:border-[var(--ml-dark-border-strong)] active:scale-[0.99]",
                    selected
                      ? "border-[var(--ml-dark-mint)] bg-[var(--ml-dark-surface)] shadow-[0_0_0_1px_rgb(8_224_212_/_0.3)]"
                      : "border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)]",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4",
                      selected ? "text-[var(--ml-dark-mint)]" : "text-[var(--ml-dark-ink)]",
                    )}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="text-[15px] font-semibold text-[var(--ml-dark-ink)]">
                    {preset.label}
                  </span>
                  <span className="text-sm text-[var(--ml-dark-ink-muted)]">
                    {preset.description}
                  </span>
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
          <p className="mb-3 text-[15px] font-medium text-[var(--ml-dark-ink)]">Preferred date</p>
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
          <legend className="mb-3 block text-[15px] font-medium text-[var(--ml-dark-ink)]">
            Available times
          </legend>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
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
                    "rounded-2xl border px-3 py-3.5 text-center text-sm font-semibold transition-all duration-150",
                    disabled && "cursor-not-allowed opacity-40",
                    selected
                      ? "border-transparent bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)] shadow-[0_0_20px_rgb(8_224_212_/_0.28)]"
                      : "border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] text-[var(--ml-dark-ink)] hover:border-[var(--ml-dark-border-strong)]",
                  )}
                >
                  {window.label}
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
        <p className="rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-3.5 text-[15px] text-[var(--ml-dark-ink-muted)]">
          We&apos;ll aim for the soonest available window
          {arrivalWindow
            ? ` (${ARRIVAL_WINDOWS.find((w) => w.id === arrivalWindow)?.label?.toLowerCase()})`
            : ""}
          .
        </p>
      ) : null}

      {mode === "time" && !date ? (
        <p className="text-[15px] text-[var(--ml-dark-ink-muted)]">
          Pick a day first, then choose a window.
        </p>
      ) : null}
    </div>
  );
}
