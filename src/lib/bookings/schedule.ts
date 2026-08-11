import { ARRIVAL_WINDOWS, type ArrivalWindowId } from "@/lib/bookings/constants";

export interface ResolvedSchedule {
  scheduledAt: string;
  arrivalWindowStart: string;
  arrivalWindowEnd: string;
}

export function resolveSchedule(date: string, arrivalWindow: ArrivalWindowId): ResolvedSchedule {
  const window = ARRIVAL_WINDOWS.find((item) => item.id === arrivalWindow);

  if (!window) {
    throw new Error("Invalid arrival window.");
  }

  const start = new Date(`${date}T${String(window.startHour).padStart(2, "0")}:00:00`);
  const end = new Date(`${date}T${String(window.endHour).padStart(2, "0")}:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error("Invalid schedule.");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    throw new Error("Schedule date must be in the future.");
  }

  return {
    scheduledAt: start.toISOString(),
    arrivalWindowStart: start.toISOString(),
    arrivalWindowEnd: end.toISOString(),
  };
}
