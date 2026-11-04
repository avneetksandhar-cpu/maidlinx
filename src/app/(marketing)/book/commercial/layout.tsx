import { BrandLockup } from "@/components/brand/brand-lockup";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { routes } from "@/config/site";

/**
 * Public commercial intake chrome — midnight navy, circular logo, South Florida.
 * Pre-auth path after homepage Check availability.
 */
export default function CommercialBookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-theme="ml-dark"
      className="min-h-dvh !bg-[#01193D] text-white"
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        backgroundColor: "#01193D",
      }}
    >
      <div className="mx-auto flex w-full max-w-[390px] flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-8 lg:max-w-[430px]">
        <div className="mb-4">
          <BrandLockup
            href={routes.home}
            size="default"
            tone="onDark"
            priority
            subtitle="South Florida"
          />
        </div>
        {children}
      </div>
      <CustomerBottomNav />
    </div>
  );
}
