import { CustomerShell } from "@/components/customer/customer-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
