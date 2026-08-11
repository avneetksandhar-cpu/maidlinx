import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { listAdminReviews } from "@/lib/admin/reviews";
import { requireAdminPermission } from "@/lib/admin/session";
import { formatAdminDate } from "@/lib/admin/display";

export const metadata = { title: "Reviews" };

async function ReviewsContent() {
  await requireAdminPermission("reviews.read");
  const reviews = await listAdminReviews();

  return (
    <>
      <AdminHeader title="Reviews" description="Customer ratings after completed jobs." />
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {reviews.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-muted">No reviews yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {reviews.map((review) => (
              <li key={review.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink">
                    {review.rating.toFixed(1)} ★ · {review.revieweeName ?? "Cleaner"}
                  </p>
                  <p className="text-xs text-ink-subtle">{formatAdminDate(review.createdAt)}</p>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  From {review.reviewerName ?? "Customer"} · Booking{" "}
                  <span className="font-mono">{review.bookingId.slice(0, 8)}</span>
                </p>
                {review.comment && <p className="mt-2 text-sm text-ink">{review.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default function AdminReviewsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <ReviewsContent />
      </Suspense>
    </div>
  );
}
