import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  acceptJob,
  cleanerArrivedJob,
  cleanerOnWayJob,
  completeJob,
  getJobForProfessional,
  getJobPhotos,
  startJob,
  updateJobChecklist,
} from "@/lib/pro/dashboard/jobs";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";
import {
  ACTION_TO_STATUS,
  type CleanerJobAction,
  validateCleanerStatusTransition,
} from "@/lib/pro/job-transitions";
import { updateChecklistSchema } from "@/lib/validations/pro-dashboard";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const ACTION_HANDLERS: Record<
  CleanerJobAction,
  (jobId: string, profileId: string) => Promise<void>
> = {
  accept: acceptJob,
  onTheWay: cleanerOnWayJob,
  arrived: cleanerArrivedJob,
  start: startJob,
  complete: completeJob,
};

function isCleanerJobAction(value: string): value is CleanerJobAction {
  return value in ACTION_HANDLERS;
}

function statusCodeForError(message: string): number {
  if (message.includes("do not have access")) return 403;
  if (message.includes("Invalid status transition")) return 400;
  if (message.includes("not found")) return 404;
  return 400;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { profile } = await requireProfessionalSession();
    const { id } = await context.params;

    const job = await getJobForProfessional(id, profile.id);
    if (!job) return jsonError("Job not found.", 404);

    const photos = await getJobPhotos(id, profile.id);

    return jsonSuccess({ job, photos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load job.";
    return jsonError(message, 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { profile } = await requireProfessionalSession();
    const { id } = await context.params;
    const body = await request.json();
    const action = body.action as string;

    if (action === "checklist") {
      const parsed = updateChecklistSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.errors[0]?.message ?? "Invalid checklist.", 400);
      }
      await updateJobChecklist(id, profile.id, parsed.data.checklist);
      return jsonSuccess({ updated: true });
    }

    if (!isCleanerJobAction(action)) {
      return jsonError("Unknown action.", 400);
    }

    const toStatus = ACTION_TO_STATUS[action];
    if (action !== "accept") {
      const job = await getJobForProfessional(id, profile.id);
      if (!job) return jsonError("Job not found.", 404);

      const validation = validateCleanerStatusTransition(job.status, toStatus);
      if (!validation.valid) {
        return jsonError(validation.error, 400);
      }
    }

    await ACTION_HANDLERS[action](id, profile.id);
    return jsonSuccess({ action, status: toStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update job.";
    return jsonError(message, statusCodeForError(message));
  }
}
