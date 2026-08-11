import { Heading, Text } from "@/components/ui";

interface ProHeaderProps {
  title: string;
  description?: string;
  badge?: string;
}

export function ProHeader({ title, description, badge }: ProHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-3">
        <Heading as="h1">{title}</Heading>
        {badge && (
          <span className="rounded-full bg-gold-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold">
            {badge}
          </span>
        )}
      </div>
      {description && (
        <Text muted className="mt-2 max-w-2xl">
          {description}
        </Text>
      )}
    </div>
  );
}
