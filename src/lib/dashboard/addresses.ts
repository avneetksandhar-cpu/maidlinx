import { assertAddressOwnedByUser } from "@/lib/addresses/authz";
import type { SavedAddress, StructuredAddress } from "@/lib/addresses/types";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

type AddressUpdate = Database["public"]["Tables"]["addresses"]["Update"];

export interface AddressWriteInput extends StructuredAddress {
  label: string;
  isDefault?: boolean;
}

function mapRow(row: Record<string, unknown>): SavedAddress {
  const country = String(row.country ?? "US").toUpperCase();
  return {
    id: String(row.id),
    label: String(row.label ?? "Home"),
    formattedAddress: row.formatted_address ? String(row.formatted_address) : undefined,
    addressLine1: String(row.line1),
    unit: row.line2 ? String(row.line2) : undefined,
    city: String(row.city),
    region: String(row.state),
    postalCode: String(row.postal_code),
    country,
    countryCode: country,
    latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : undefined,
    longitude:
      row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : undefined,
    placeId: row.google_place_id ? String(row.google_place_id) : undefined,
    isDefault: Boolean(row.is_default),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toInsertRow(userId: string, input: AddressWriteInput) {
  const country = (input.countryCode || input.country || "US").trim().toUpperCase();
  return {
    user_id: userId,
    profile_id: userId,
    label: input.label.trim(),
    line1: input.addressLine1.trim(),
    line2: input.unit?.trim() || null,
    city: input.city.trim(),
    state: input.region.trim(),
    postal_code: input.postalCode.trim(),
    country,
    formatted_address: input.formattedAddress?.trim() || null,
    google_place_id: input.placeId?.trim() || null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    is_default: Boolean(input.isDefault),
  };
}

export async function listSavedAddresses(userId: string): Promise<SavedAddress[]> {
  if (!hasAdminEnv()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    if (error.message.includes("addresses")) return [];
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getSavedAddressById(
  userId: string,
  addressId: string,
): Promise<SavedAddress | null> {
  if (!hasAdminEnv()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", addressId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as Record<string, unknown>;
  assertAddressOwnedByUser(row.user_id ? String(row.user_id) : null, userId);
  return mapRow(row);
}

export async function createSavedAddress(
  userId: string,
  input: AddressWriteInput,
): Promise<SavedAddress> {
  const supabase = createAdminClient();
  const existing = await listSavedAddresses(userId);
  const shouldDefault = input.isDefault === true || existing.length === 0;

  const { data, error } = await supabase
    .from("addresses")
    .insert(toInsertRow(userId, { ...input, isDefault: shouldDefault }))
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to save address.");
  }

  return mapRow(data as Record<string, unknown>);
}

export async function updateSavedAddress(
  userId: string,
  addressId: string,
  patch: Partial<AddressWriteInput>,
): Promise<SavedAddress> {
  const supabase = createAdminClient();
  const { data: existing, error: loadError } = await supabase
    .from("addresses")
    .select("*")
    .eq("id", addressId)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!existing) throw new Error("Address not found.");

  const row = existing as Record<string, unknown>;
  assertAddressOwnedByUser(row.user_id ? String(row.user_id) : null, userId);

  const update: AddressUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (patch.label !== undefined) update.label = patch.label.trim();
  if (patch.addressLine1 !== undefined) update.line1 = patch.addressLine1.trim();
  if (patch.unit !== undefined) update.line2 = patch.unit.trim() || null;
  if (patch.city !== undefined) update.city = patch.city.trim();
  if (patch.region !== undefined) update.state = patch.region.trim();
  if (patch.postalCode !== undefined) update.postal_code = patch.postalCode.trim();
  if (patch.countryCode !== undefined || patch.country !== undefined) {
    update.country = (patch.countryCode || patch.country || "US").trim().toUpperCase();
  }
  if (patch.formattedAddress !== undefined) {
    update.formatted_address = patch.formattedAddress?.trim() || null;
  }
  if (patch.placeId !== undefined) update.google_place_id = patch.placeId?.trim() || null;
  if (patch.latitude !== undefined) update.latitude = patch.latitude ?? null;
  if (patch.longitude !== undefined) update.longitude = patch.longitude ?? null;
  if (patch.isDefault !== undefined) update.is_default = patch.isDefault;

  const { data, error } = await supabase
    .from("addresses")
    .update(update)
    .eq("id", addressId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to update address.");
  }

  return mapRow(data as Record<string, unknown>);
}

export async function deleteSavedAddress(userId: string, addressId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: existing, error: loadError } = await supabase
    .from("addresses")
    .select("id, user_id")
    .eq("id", addressId)
    .maybeSingle();

  if (loadError) throw new Error(loadError.message);
  if (!existing) throw new Error("Address not found.");

  const row = existing as Record<string, unknown>;
  assertAddressOwnedByUser(row.user_id ? String(row.user_id) : null, userId);

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function setDefaultSavedAddress(
  userId: string,
  addressId: string,
): Promise<SavedAddress> {
  return updateSavedAddress(userId, addressId, { isDefault: true });
}

/** Most recent booking address for the logged-in customer (DB only). */
export async function getRecentBookingAddress(
  userId: string,
  email?: string | null,
): Promise<StructuredAddress | null> {
  if (!hasAdminEnv()) return null;

  const supabase = createAdminClient();
  let query = supabase
    .from("bookings")
    .select(
      "address_line1, address_line2, address_city, address_state, address_postal_code, address_country, address_latitude, address_longitude, google_place_id, created_at",
    )
    .not("address_line1", "is", null);

  if (email) {
    query = query.or(`customer_id.eq.${userId},customer_email.eq.${email}`);
  } else {
    query = query.eq("customer_id", userId);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const line1 = row.address_line1 ? String(row.address_line1) : "";
  const city = row.address_city ? String(row.address_city) : "";
  const region = row.address_state ? String(row.address_state) : "";
  const postalCode = row.address_postal_code ? String(row.address_postal_code) : "";
  if (!line1 || !city || !region || !postalCode) return null;

  const country = String(row.address_country ?? "US").toUpperCase();
  return {
    addressLine1: line1,
    unit: row.address_line2 ? String(row.address_line2) : undefined,
    city,
    region,
    postalCode,
    country,
    countryCode: country,
    latitude:
      row.address_latitude !== null && row.address_latitude !== undefined
        ? Number(row.address_latitude)
        : undefined,
    longitude:
      row.address_longitude !== null && row.address_longitude !== undefined
        ? Number(row.address_longitude)
        : undefined,
    placeId: row.google_place_id ? String(row.google_place_id) : undefined,
    formattedAddress: undefined,
  };
}
