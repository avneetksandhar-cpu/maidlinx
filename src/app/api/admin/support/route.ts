import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  createSupportIssue,
  listSupportIssues,
  updateSupportIssue,
  type SupportIssueType,
} from "@/lib/admin/support-issues";
import { requireAdminApiPermission } from "@/lib/admin/session";
import { updateSupportIssueSchema } from "@/lib/validations/admin";
import { z } from "zod";

const createSchema = z.object({
  bookingId: z.string().uuid().optional(),
  issueType: z.enum([
    "customer_issue",
    "re_clean_request",
    "payment_issue",
    "cancellation",
    "cleaner_late",
    "other",
  ]),
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdminApiPermission("support.read");
    const { searchParams } = new URL(request.url);
    const issues = await listSupportIssues({
      status: searchParams.get("status") ?? undefined,
      issueType: searchParams.get("issueType") ?? undefined,
    });
    return jsonSuccess({ issues });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load support issues.";
    const status = message.includes("denied") || message.includes("Insufficient") ? 403 : 400;
    return jsonError(message, status);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApiPermission("support.write");
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid support issue.", 400);
    }
    const id = await createSupportIssue(admin.id, {
      ...parsed.data,
      issueType: parsed.data.issueType as SupportIssueType,
    });
    return jsonSuccess({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create support issue.";
    const status = message.includes("denied") || message.includes("Insufficient") ? 403 : 400;
    return jsonError(message, status);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminApiPermission("support.write");
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : null;
    if (!id) return jsonError("Issue id is required.", 400);
    const parsed = updateSupportIssueSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid update.", 400);
    }
    await updateSupportIssue(admin.id, id, parsed.data);
    return jsonSuccess({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update support issue.";
    const status = message.includes("denied") || message.includes("Insufficient") ? 403 : 400;
    return jsonError(message, status);
  }
}
