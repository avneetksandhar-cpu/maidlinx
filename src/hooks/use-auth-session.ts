"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";

export type AuthSessionStatus = "loading" | "authenticated" | "guest";

/**
 * Lightweight client session probe for booking gates.
 * Does not invent users — reflects Supabase session only.
 */
export function useAuthSession(): AuthSessionStatus {
  const supabase = useSupabase();
  const [status, setStatus] = useState<AuthSessionStatus>("loading");

  useEffect(() => {
    if (!supabase) {
      setStatus("guest");
      return;
    }

    let cancelled = false;

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setStatus(data.session ? "authenticated" : "guest");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? "authenticated" : "guest");
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return status;
}
