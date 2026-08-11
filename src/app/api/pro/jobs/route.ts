import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  getAvailableJobs,
  getJobHistory,
  getMyJobs,
  getTodaySchedule,
  getUpcomingJobs,
} from "@/lib/pro/dashboard/jobs";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

export async function GET(request: Request) {
  try {
    const { profile } = await requireProfessionalSession();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") ?? "available";

    if (filter === "today") {
      const jobs = await getTodaySchedule(profile.id);
      return jsonSuccess({ jobs });
    }

    if (filter === "upcoming") {
      const jobs = await getUpcomingJobs(profile.id);
      return jsonSuccess({ jobs });
    }

    if (filter === "active" || filter === "assigned") {
      const jobs = await getMyJobs(profile.id);
      return jsonSuccess({ jobs });
    }

    if (filter === "history") {
      const jobs = await getJobHistory(profile.id);
      return jsonSuccess({ jobs });
    }

    const jobs = await getAvailableJobs(profile.id);
    return jsonSuccess({ jobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load jobs.";
    return jsonError(message, message.includes("Authentication") ? 401 : 500);
  }
}
