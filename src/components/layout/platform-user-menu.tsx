"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui";
import { routes } from "@/config/site";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/config/env";
import { useRouter } from "next/navigation";

export function PlatformUserMenu() {
  const router = useRouter();

  async function handleSignOut() {
    if (hasSupabaseEnv()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push(routes.home);
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Sign out">
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
