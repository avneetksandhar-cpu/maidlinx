"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui";
import { routes } from "@/config/site";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/config/env";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type PlatformUserMenuProps = {
  /** Show visible "Sign out" label (default true for clarity/accessibility). */
  showLabel?: boolean;
  /** Dark iOS mint shell vs light ghost button. */
  tone?: "dark" | "light";
  className?: string;
};

export function PlatformUserMenu({
  showLabel = true,
  tone = "light",
  className,
}: PlatformUserMenuProps) {
  const router = useRouter();

  async function handleSignOut() {
    if (hasSupabaseEnv()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push(routes.signIn);
    router.refresh();
  }

  const dark = tone === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      aria-label="Sign out"
      className={cn(
        showLabel ? "h-10 gap-2 px-3" : "h-9 w-9 px-0",
        dark &&
          "text-[var(--ml-dark-ink-muted)] hover:bg-[var(--ml-dark-surface)] hover:text-[var(--ml-dark-mint)] focus-visible:ring-[var(--ml-dark-mint)]/50",
        className,
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
      {showLabel && <span className="text-sm font-medium">Sign out</span>}
    </Button>
  );
}
