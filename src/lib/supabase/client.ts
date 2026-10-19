import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/config/env";
import type { Database } from "@/types/database.types";

export function createClient() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error("Missing Supabase client environment variables.");
  }

  return createBrowserClient<Database>(url, anonKey);
}
