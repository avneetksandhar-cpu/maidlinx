import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export interface AdminCustomer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  bookingCount: number;
  totalSpentCents: number;
  createdAt: string;
}

export async function listCustomers(search?: string, limit = 50): Promise<AdminCustomer[]> {
  if (!hasAdminEnv()) {
    return [];
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const customers = await Promise.all(
    (data ?? []).map(async (row) => {
      const profile = row as Record<string, unknown>;
      const profileId = String(profile.id);

      const { data: bookings } = await supabase
        .from("bookings")
        .select("total_cents")
        .or(`customer_id.eq.${profileId},customer_email.not.is.null`);

      const customerBookings = (bookings ?? []).filter(() => true);
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", profileId);

      const totalSpent = customerBookings.reduce((sum, b) => sum + Number(b.total_cents), 0);

      return {
        id: profileId,
        firstName: profile.first_name ? String(profile.first_name) : null,
        lastName: profile.last_name ? String(profile.last_name) : null,
        email: profile.email ? String(profile.email) : null,
        phone: profile.phone ? String(profile.phone) : null,
        bookingCount: count ?? 0,
        totalSpentCents: totalSpent,
        createdAt: String(profile.created_at),
      };
    }),
  );

  return customers;
}
