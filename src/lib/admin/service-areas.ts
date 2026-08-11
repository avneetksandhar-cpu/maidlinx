import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";

export interface ServiceArea {
  id: string;
  name: string;
  city: string;
  state: string;
  postalCodes: string[];
  isActive: boolean;
  createdAt: string;
}

export async function listServiceAreas(): Promise<ServiceArea[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("service_areas").select("*").order("name");

  if (error) {
    if (error.message.includes("service_areas")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map(mapArea);
}

function mapArea(row: Record<string, unknown>): ServiceArea {
  return {
    id: String(row.id),
    name: String(row.name),
    city: String(row.city),
    state: String(row.state),
    postalCodes: Array.isArray(row.postal_codes) ? (row.postal_codes as string[]) : [],
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
  };
}

export async function createServiceArea(
  adminId: string,
  input: Omit<ServiceArea, "id" | "createdAt">,
): Promise<ServiceArea> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("service_areas")
    .insert({
      name: input.name,
      city: input.city,
      state: input.state,
      postal_codes: input.postalCodes,
      is_active: input.isActive,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create service area.");

  await writeAuditLog({
    adminProfileId: adminId,
    action: "service_area.create",
    entityType: "service_area",
    entityId: String(data.id),
  });

  return mapArea(data as Record<string, unknown>);
}

export async function toggleServiceArea(
  adminId: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("service_areas").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    adminProfileId: adminId,
    action: "service_area.toggle",
    entityType: "service_area",
    entityId: id,
    metadata: { isActive },
  });
}
