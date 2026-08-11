import { Heading, Text } from "@/components/ui";

interface DashboardHeaderProps {
  title: string;
  description?: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <Heading as="h1">{title}</Heading>
      {description && (
        <Text muted className="mt-2 max-w-2xl">
          {description}
        </Text>
      )}
    </div>
  );
}
