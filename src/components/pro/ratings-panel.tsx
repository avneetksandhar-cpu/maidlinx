import { Card, CardContent } from "@/components/ui";
import type { ProRating, RatingsSummary } from "@/lib/pro/dashboard/ratings";
import { getServiceLabel } from "@/lib/pro/dashboard/display";

interface RatingsPanelProps {
  summary: RatingsSummary;
  ratings: ProRating[];
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-gold" : "text-border-strong"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 1.5l2.2 4.5 4.9.7-3.5 3.4.8 4.9L10 12.8 5.6 14.9l.8-4.9-3.5-3.4 4.9-.7L10 1.5Z" />
        </svg>
      ))}
    </div>
  );
}

export function RatingsPanel({ summary, ratings }: RatingsPanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-6">
          <div>
            <p className="font-display text-5xl font-semibold text-ink">
              {summary.average.toFixed(1)}
            </p>
            <StarRow rating={Math.round(summary.average)} />
          </div>
          <div>
            <p className="text-sm text-ink-muted">Based on</p>
            <p className="font-medium text-ink">
              {summary.count} review{summary.count === 1 ? "" : "s"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {ratings.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No reviews yet. Complete jobs to start building your reputation.
          </p>
        ) : (
          ratings.map((rating) => (
            <Card key={rating.id}>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink">{rating.reviewerName}</p>
                  <StarRow rating={rating.rating} />
                </div>
                {rating.serviceType && (
                  <p className="text-xs uppercase tracking-wide text-ink-subtle">
                    {getServiceLabel(rating.serviceType)}
                  </p>
                )}
                {rating.comment && <p className="text-sm text-ink-muted">{rating.comment}</p>}
                <p className="text-xs text-ink-subtle">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(rating.createdAt))}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
