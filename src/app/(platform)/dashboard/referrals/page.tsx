import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card, CardContent } from "@/components/ui";
import { ensureReferralCode, REFERRAL_CREDITS_LIVE } from "@/lib/referrals";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Referrals" };

export default async function DashboardReferralsPage() {
  const { profile } = await requireCustomerSession();
  const code = await ensureReferralCode(profile.id);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <DashboardHeader
        title="Referrals"
        description="Share MaidLinx with friends. Credits stay off until accounting is approved."
      />

      <Card>
        <CardContent className="space-y-4">
          {code ? (
            <>
              <div>
                <p className="text-sm text-ink-muted">Your code</p>
                <p className="mt-1 font-mono text-2xl font-semibold tracking-wide text-ink">
                  {code.code}
                </p>
              </div>
              <p className="text-sm text-ink">
                Planned offer: give {formatCurrency(code.giveCents)} · get{" "}
                {formatCurrency(code.getCents)} — architecture only.
              </p>
            </>
          ) : (
            <p className="text-sm text-ink-muted">
              Referral tables are not available yet. Apply migration 00023, or set service role
              locally.
            </p>
          )}
          <p className="rounded-xl bg-[#F4FBF7] px-3 py-2 text-xs text-ink-muted">
            Credits live: <strong>{REFERRAL_CREDITS_LIVE ? "YES" : "NO"}</strong>. Self-referral and
            duplicate abuse are blocked. Product approval required before activating credits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
