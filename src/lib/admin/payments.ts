import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export interface AdminPayment {
  id: string;
  bookingId: string;
  amountCents: number;
  currency: string;
  status: string;
  paymentType: string;
  stripePaymentIntentId: string | null;
  stripeReceiptUrl: string | null;
  customerEmail: string | null;
  invoiceNumber: string | null;
  bookingStatus: string | null;
  createdAt: string;
}

export async function listPayments(search?: string, limit = 100): Promise<AdminPayment[]> {
  if (!hasAdminEnv()) {
    return [];
  }

  const supabase = createAdminClient();

  const query = supabase
    .from("payments")
    .select(
      `
      *,
      booking:bookings!payments_booking_id_fkey (
        customer_email,
        invoice_number,
        status
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  const { data, error } = await query;

  if (error) {
    if (error.message.includes("payments_booking_id_fkey")) {
      const fallback = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (fallback.error) throw new Error(fallback.error.message);
      return (fallback.data ?? []).map((row) => mapPayment(row as Record<string, unknown>));
    }
    throw new Error(error.message);
  }

  let rows = (data ?? []).map((row) => mapPayment(row as Record<string, unknown>));

  if (search) {
    const term = search.toLowerCase();
    rows = rows.filter(
      (p) =>
        p.customerEmail?.toLowerCase().includes(term) ||
        p.invoiceNumber?.toLowerCase().includes(term) ||
        p.stripePaymentIntentId?.toLowerCase().includes(term),
    );
  }

  return rows;
}

function mapPayment(row: Record<string, unknown>): AdminPayment {
  const booking = row.booking as Record<string, unknown> | null;
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    amountCents: Number(row.amount_cents),
    currency: String(row.currency),
    status: String(row.status),
    paymentType: String(row.payment_type),
    stripePaymentIntentId: row.stripe_payment_intent_id
      ? String(row.stripe_payment_intent_id)
      : null,
    stripeReceiptUrl: row.stripe_receipt_url ? String(row.stripe_receipt_url) : null,
    customerEmail: booking?.customer_email ? String(booking.customer_email) : null,
    invoiceNumber: booking?.invoice_number ? String(booking.invoice_number) : null,
    bookingStatus: booking?.status ? String(booking.status) : null,
    createdAt: String(row.created_at),
  };
}
