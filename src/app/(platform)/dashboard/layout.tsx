import { BusinessShell } from "@/components/dashboard/business-shell";
import { requireCustomerSession } from "@/lib/dashboard/session";

/**
 * Commercial-first customer chrome (Overview · Sites · Jobs · Billing).
 * Residential home booking remains available at `/` as a secondary path.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireCustomerSession();

  return (
    <BusinessShell firstName={profile.firstName ?? undefined}>{children}</BusinessShell>
  );
}
