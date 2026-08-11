import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import { emitBookingEvent } from "@/lib/bookings/events";

export type SupportIssueType =
  | "customer_issue"
  | "re_clean_request"
  | "payment_issue"
  | "cancellation"
  | "cleaner_late"
  | "other";

export interface SupportIssue {
  id: string;
  bookingId: string | null;
  issueType: SupportIssueType;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  resolution: string | null;
  createdAt: string;
}

export async function listSupportIssues(filters?: {
  status?: string;
  issueType?: string;
}): Promise<SupportIssue[]> {
  if (!hasAdminEnv()) return [];

  const supabase = createAdminClient();
  let query = supabase.from("support_issues").select("*").order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.issueType && filters.issueType !== "all") {
    query = query.eq("issue_type", filters.issueType);
  }

  const { data, error } = await query;
  if (error) {
    if (error.message.includes("support_issues")) {
      // Fallback: map disputes into support issues shape.
      const { data: disputes } = await supabase
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });
      return (disputes ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          id: String(r.id),
          bookingId: r.booking_id ? String(r.booking_id) : null,
          issueType: "customer_issue" as const,
          subject: String(r.subject),
          description: r.description ? String(r.description) : null,
          status: String(r.status),
          priority: "normal",
          resolution: r.resolution ? String(r.resolution) : null,
          createdAt: String(r.created_at),
        };
      });
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      bookingId: r.booking_id ? String(r.booking_id) : null,
      issueType: String(r.issue_type) as SupportIssueType,
      subject: String(r.subject),
      description: r.description ? String(r.description) : null,
      status: String(r.status),
      priority: String(r.priority ?? "normal"),
      resolution: r.resolution ? String(r.resolution) : null,
      createdAt: String(r.created_at),
    };
  });
}

export async function updateSupportIssue(
  adminId: string,
  id: string,
  updates: { status?: string; resolution?: string; priority?: string },
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("support_issues")
    .update({
      status: updates.status,
      resolution: updates.resolution,
      priority: updates.priority,
      assigned_admin_id: adminId,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await writeAuditLog({
    adminProfileId: adminId,
    action: "support_issue.update",
    entityType: "support_issue",
    entityId: id,
    metadata: updates,
  });
}

export async function createSupportIssue(
  adminId: string,
  input: {
    bookingId?: string;
    issueType: SupportIssueType;
    subject: string;
    description?: string;
    priority?: string;
  },
): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("support_issues")
    .insert({
      booking_id: input.bookingId ?? null,
      issue_type: input.issueType,
      subject: input.subject,
      description: input.description ?? null,
      priority: input.priority ?? "normal",
      assigned_admin_id: adminId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const id = String(data.id);
  if (input.bookingId) {
    await emitBookingEvent({
      bookingId: input.bookingId,
      eventType: "support_issue_opened",
      actorType: "admin",
      actorId: adminId,
      payload: { issueId: id, issueType: input.issueType },
    });
  }

  await writeAuditLog({
    adminProfileId: adminId,
    action: "support_issue.create",
    entityType: "support_issue",
    entityId: id,
    metadata: input,
  });

  return id;
}
