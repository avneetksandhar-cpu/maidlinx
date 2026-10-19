import { ProEmptyState } from "@/components/pro/pro-empty-state";
import { routes } from "@/config/site";

export const metadata = {
  title: "Messages",
};

export default function CleanerMessagesPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:max-w-xl lg:max-w-2xl lg:px-8 lg:py-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight text-[var(--ml-dark-ink)]">
        Messages
      </h1>
      <ProEmptyState
        title="Messaging isn’t available yet"
        description="In-app cleaner messaging is not live. Use job details for customer contact when a job is assigned."
        actionLabel="My jobs"
        actionHref={`${routes.cleanerJobs}?tab=today`}
      />
    </div>
  );
}
