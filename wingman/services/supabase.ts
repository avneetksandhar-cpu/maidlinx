/**
 * Supabase service layer — higher-level data access built on lib/supabase clients.
 * Use lib/supabase/client or lib/supabase/server for low-level client creation.
 */

export { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
export { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
