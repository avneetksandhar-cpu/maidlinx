import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getAvailability } from "@/lib/pro/dashboard/availability";
import { getEarningsSummary } from "@/lib/pro/dashboard/earnings";
import {
  getAvailableJobs,
  getMyJobs,
  getTodaySchedule,
} from "@/lib/pro/dashboard/jobs";
import { getRatingsSummary } from "@/lib/pro/dashboard/ratings";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export async function GET() {
  try {
    const { profile } = await requireProfessionalSession();

    const [available, today, active, earnings, ratings, availability] = await Promise.all([
      getAvailableJobs(),
      getTodaySchedule(profile.id),
      getMyJobs(profile.id),
      getEarningsSummary(profile.id),
      getRatingsSummary(profile.id),
      getAvailability(profile.id),
    ]);

    return jsonSuccess({
      profile,
      available,
      today,
      active,
      earnings,
      ratings,
      availability,
      counts: {
        available: available.length,
        today: today.length,
        active: active.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load dashboard.";
    return jsonError(message, message === "Authentication required." ? 401 : 500);
  }
}
