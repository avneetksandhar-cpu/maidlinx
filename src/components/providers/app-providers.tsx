"use client";

import { SupabaseProvider } from "@/components/providers/supabase-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <SupabaseProvider>{children}</SupabaseProvider>;
}
