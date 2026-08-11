import Link from "next/link";
import { Card, CardContent, Heading, Text } from "@/components/ui";

interface ProEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function ProEmptyState({ title, description, actionLabel, actionHref }: ProEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-muted text-gold">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
            <path d="M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.75" />
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
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-white transition-colors hover:bg-gold-hover"
          >
            {actionLabel}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
