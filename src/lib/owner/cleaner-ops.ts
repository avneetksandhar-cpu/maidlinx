/**
 * Owner/admin ops to enter REAL cleaner market coverage data.
 * Does not invent markets, zones, services, or availability.
 */

import { writeAuditLog } from "@/lib/admin/audit";
import {
  addUnavailableDate,
  listUnavailableDates,
  removeUnavailableDate,
  type UnavailableDate,
} from "@/lib/cleaners/unavailable-dates";
import {
  catalogServicesForUi,
  catalogZonesForUi,
  getCleanerCapabilities,
  updateCleanerCapabilities,
  type CleanerCapabilities,
} from "@/lib/pro/dashboard/capabilities";
import {
  defaultAvailability,
  getAvailability,
  updateAvailability,
  type AvailabilitySlot,
} from "@/lib/pro/dashboard/availability";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export interface OwnerCleanerOpsSnapshot {
  cleanerId: string;
  profileId: string | null;
  displayName: string;
  approved: boolean;
  active: boolean;
  onboardingStatus: string;
  isOnline: boolean;
  capabilities: CleanerCapabilities | null;
  availability: AvailabilitySlot[];
  availabilityPersisted: boolean;
  unavailableDates: UnavailableDate[];
  servicesCatalog: ReturnType<typeof catalogServicesForUi>;
  zonesCatalog: ReturnType<typeof catalogZonesForUi>;
}

export async function loadOwnerCleanerOps(
  cleanerId: string,
): Promise<OwnerCleanerOpsSnapshot | null> {
  if (!hasAdminEnv()) return null;

  const supabase = createAdminClient();
  const { data: cleaner, error } = await supabase
    .from("cleaners")
    .select("id, user_id, approved, is_active, onboarding_status, is_online")
    .eq("id", cleanerId)
    .maybeSingle();

  if (error || !cleaner) return null;

  const record = cleaner as Record<string, unknown>;
  const profileId = record.user_id ? String(record.user_id) : null;

  let displayName = cleanerId.slice(0, 8);
  if (profileId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", profileId)
      .maybeSingle();
    if (profile) {
      const p = profile as Record<string, unknown>;
      const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
      if (name) displayName = name;
    }
  }

  const capabilities = profileId
    ? await getCleanerCapabilities(profileId)
    : await getCleanerCapabilitiesByCleanerId(cleanerId);

  let availability = defaultAvailability();
  let availabilityPersisted = false;
  if (profileId) {
    const { count } = await supabase
      .from("professional_availability")
      .select("*", { count: "exact", head: true })
      .eq("professional_profile_id", profileId);
    availabilityPersisted = (count ?? 0) > 0;
    availability = await getAvailability(profileId);
  }

  const unavailableDates = await listUnavailableDates(cleanerId);

  return {
    cleanerId,
    profileId,
    displayName,
    approved: Boolean(record.approved),
    active: Boolean(record.is_active),
    onboardingStatus: String(record.onboarding_status ?? "NOT_STARTED"),
    isOnline: Boolean(record.is_online),
    capabilities,
    availability,
    availabilityPersisted,
    unavailableDates,
    servicesCatalog: catalogServicesForUi(),
    zonesCatalog: catalogZonesForUi(),
  };
}

async function getCleanerCapabilitiesByCleanerId(
  cleanerId: string,
): Promise<CleanerCapabilities | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("cleaners")
    .select("user_id")
    .eq("id", cleanerId)
    .maybeSingle();
  const profileId = data?.user_id ? String(data.user_id) : null;
  if (!profileId) return null;
  return getCleanerCapabilities(profileId);
}

export async function saveOwnerCleanerOps(input: {
  adminProfileId: string;
  cleanerId: string;
  marketId: string;
  serviceIds: string[];
  zoneIds: string[];
  hasVehicle?: boolean;
  travelRadiusKm?: number | null;
  isOnline?: boolean;
  slots?: AvailabilitySlot[];
  unavailableDates?: Array<{ unavailableDate: string; reason?: string | null }>;
}): Promise<OwnerCleanerOpsSnapshot> {
  const snap = await loadOwnerCleanerOps(input.cleanerId);
  if (!snap) throw new Error("Cleaner not found.");
  if (!snap.profileId) {
    throw new Error("Cleaner has no linked profile — cannot save availability.");
  }

  await updateCleanerCapabilities(snap.profileId, {
    marketId: input.marketId,
    serviceIds: input.serviceIds,
    zoneIds: input.zoneIds,
    hasVehicle: input.hasVehicle,
    travelRadiusKm: input.travelRadiusKm,
  });

  if (input.slots) {
    await updateAvailability(snap.profileId, input.slots);
  }

  if (typeof input.isOnline === "boolean") {
    const supabase = createAdminClient();
    await supabase
      .from("cleaners")
      .update({ is_online: input.isOnline } as never)
      .eq("id", input.cleanerId);
    await supabase
      .from("professionals")
      .update({ is_online: input.isOnline })
      .eq("id", input.cleanerId);
  }

  if (input.unavailableDates) {
    const desired = new Set(
      input.unavailableDates.map((d) => d.unavailableDate).filter(Boolean),
    );
    const existing = await listUnavailableDates(input.cleanerId);
    for (const row of existing) {
      if (!desired.has(row.unavailableDate)) {
        await removeUnavailableDate(input.cleanerId, row.unavailableDate);
      }
    }
    const existingSet = new Set(existing.map((d) => d.unavailableDate));
    for (const row of input.unavailableDates) {
      if (!existingSet.has(row.unavailableDate)) {
        await addUnavailableDate({
          cleanerId: input.cleanerId,
          unavailableDate: row.unavailableDate,
          reason: row.reason ?? null,
        });
      }
    }
  }

  await writeAuditLog({
    adminProfileId: input.adminProfileId,
    action: "cleaner.ops.update",
    entityType: "cleaner",
    entityId: input.cleanerId,
    metadata: {
      marketId: input.marketId,
      serviceCount: input.serviceIds.length,
      zoneCount: input.zoneIds.length,
      availabilitySaved: Boolean(input.slots),
      isOnline: input.isOnline ?? null,
    },
  });

  const updated = await loadOwnerCleanerOps(input.cleanerId);
  if (!updated) throw new Error("Unable to reload cleaner after save.");
  return updated;
}
