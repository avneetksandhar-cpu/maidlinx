"use client";

import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/config/env";
import { createContext, useContext, useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const SupabaseContext = createContext<SupabaseClient<Database> | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => {
    if (!hasSupabaseEnv()) {
      return null;
    }
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

export function useSupabase() {
  return useContext(SupabaseContext);
}
