import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button, Card, CardContent } from "@/components/ui";
import { routes, siteConfig } from "@/config/site";
import { getNotificationProviderStatus } from "@/lib/retention/events";
import { requireCustomerSession } from "@/lib/dashboard/session";

export const metadata = { title: "Support" };

export default async function DashboardSupportPage() {
  await requireCustomerSession();
  const providers = getNotificationProviderStatus();

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <DashboardHeader
        title="Support"
        description="Get help with bookings, payments, or cancellations."
      />

      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink">Most useful first</h2>
            <div className="flex flex-wrap gap-2">
              <Link href={routes.dashboardBookings}>
                <Button size="sm" variant="accent">
                  View bookings
                </Button>
              </Link>
              <Link href={routes.book}>
                <Button size="sm" variant="secondary">
                  Book again
                </Button>
              </Link>
              <Link href={routes.dashboardReceipts}>
                <Button size="sm" variant="ghost">
                  Receipts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2">
            <h2 className="font-display text-lg font-semibold text-ink">Contact</h2>
            <p className="text-sm text-ink-muted">
              Email{" "}
              <a className="text-accent underline" href={siteConfig.links.support}>
                {siteConfig.links.support.replace("mailto:", "")}
              </a>
              . Include your booking reference when possible.
            </p>
            <p className="text-xs text-ink-subtle">
              Retention reminders: {providers.message}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
