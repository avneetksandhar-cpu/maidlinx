import { BusinessShell } from "@/components/dashboard/business-shell";
import { CustomerShell } from "@/components/customer/customer-shell";
import { listSavedAddresses } from "@/lib/dashboard/addresses";
import { requireCustomerSession } from "@/lib/dashboard/session";

/**
 * Multi-property accounts (2+ saved places) get the B2B dark-sidebar shell.
 * Single-property / new customers keep the simpler residential CustomerShell.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireCustomerSession();
  let addresses: Awaited<ReturnType<typeof listSavedAddresses>> = [];
  try {
    addresses = await listSavedAddresses(profile.id);
  } catch {
    addresses = [];
  }

  const isBusiness = addresses.length >= 2;

  if (isBusiness) {
    return (
      <BusinessShell firstName={profile.firstName ?? undefined}>{children}</BusinessShell>
    );
  }

  return <CustomerShell>{children}</CustomerShell>;
}
