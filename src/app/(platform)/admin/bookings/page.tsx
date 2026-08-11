import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { BookingsTable } from "@/components/admin/bookings-table";
import { listBookings } from "@/lib/admin/bookings";
import { requireAdminPermission } from "@/lib/admin/session";
import { hasAdminEnv } from "@/lib/supabase/admin";

export const metadata = { title: "Bookings" };

async function BookingsContent() {
  await requireAdminPermission("bookings.read");
  const { bookings } = await listBookings({ limit: 200 });

  return (
    <>
      <AdminHeader
        title="Bookings"
        description="Search, filter, and manage bookings. Assign cleaners and update status."
      />

      {!hasAdminEnv() && (
        <div className="mb-6 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-ink-muted">
          Database not configured. Bookings will appear once Supabase is connected.
        </div>
      )}

      <BookingsTable bookings={bookings} />
    </>
  );
}

export default function AdminBookingsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <BookingsContent />
      </Suspense>
    </div>
  );
}
