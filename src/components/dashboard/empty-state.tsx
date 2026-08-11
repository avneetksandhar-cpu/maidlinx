import Link from "next/link";
import { Card, CardContent, Heading, Text } from "@/components/ui";
import { routes } from "@/config/site";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-accent">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <Heading as="h3" className="text-lg">
          {title}
        </Heading>
        <Text muted className="mt-2 max-w-sm">
          {description}
        </Text>
        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            {actionLabel}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export function BookEmptyState() {
  return (
    <EmptyState
      title="No bookings yet"
      description="Schedule your first clean in minutes. Vetted professionals, transparent pricing."
      actionLabel="Book a clean"
      actionHref={routes.book}
    />
  );
}
