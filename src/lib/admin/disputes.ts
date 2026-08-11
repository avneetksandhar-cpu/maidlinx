import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";

export interface Dispute {
  id: string;
  bookingId: string;
  subject: string;
  description: string | null;
  status: string;
  resolution: string | null;
  raisedByName: string | null;
  createdAt: string;
}

export async function listDisputes(status?: string): Promise<Dispute[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("disputes")
    .select(
      `
      *,
      raiser:profiles!disputes_raised_by_fkey (first_name, last_name)
    `,
    )
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    if (error.message.includes("disputes")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const raiser = record.raiser as Record<string, unknown> | null;
    return {
      id: String(record.id),
      bookingId: String(record.booking_id),
      subject: String(record.subject),
      description: record.description ? String(record.description) : null,
      status: String(record.status),
      resolution: record.resolution ? String(record.resolution) : null,
      raisedByName: raiser
        ? [raiser.first_name, raiser.last_name].filter(Boolean).join(" ") || null
        : null,
      createdAt: String(record.created_at),
    };
  });
}

export async function updateDispute(
  adminId: string,
  id: string,
  updates: { status?: string; resolution?: string },
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("disputes")
    .update({
      status: updates.status,
      resolution: updates.resolution,
      assigned_admin_id: adminId,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  await writeAuditLog({
    adminProfileId: adminId,
    action: "dispute.update",
    entityType: "dispute",
    entityId: id,
    metadata: updates,
  });
}

export async function createDispute(
  adminId: string,
  input: { bookingId: string; subject: string; description?: string },
): Promise<void> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("disputes")
    .insert({
      booking_id: input.bookingId,
      subject: input.subject,
      description: input.description ?? null,
      raised_by: adminId,
      status: "open",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await writeAuditLog({
    adminProfileId: adminId,
    action: "dispute.create",
    entityType: "dispute",
    entityId: data ? String(data.id) : undefined,
    metadata: input,
  });
}
