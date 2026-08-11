import { MarketingChrome } from "@/components/layout/marketing-chrome";
import { AuthControls } from "@/components/layout/auth-controls";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MarketingChrome authControls={<AuthControls />}>{children}</MarketingChrome>;
}
