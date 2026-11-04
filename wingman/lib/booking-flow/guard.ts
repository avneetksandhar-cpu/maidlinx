import { STEP_PATHS } from "@/lib/booking-flow/copy";
import type { BookingFlowStep, NightBookingState } from "@/lib/booking-flow/types";

export function requiredPath(state: NightBookingState, step: BookingFlowStep): string | null {
  if (step === "location") return null;
  if (!state.destination) return STEP_PATHS.location;
  if (step === "when") return null;
  if (!state.when || !state.date) return STEP_PATHS.when;
  if (step === "experience") return null;
  if (!state.experienceType) return STEP_PATHS.experience;
  if (step === "vibe") return null;
  if (!state.vibe) return STEP_PATHS.vibe;
  if (step === "party") return null;
  if (step === "budget") return null;
  if (!state.budget) return STEP_PATHS.budget;
  if (step === "matches") return null;
  if (step === "confirm") return state.selectedMatch || state.destination ? null : STEP_PATHS.matches;
  if (step === "matching" || step === "wingman" || step === "payment") {
    return state.requestId ? null : STEP_PATHS.confirm;
  }
  return null;
}
