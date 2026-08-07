export type AuthProvider = "supabase" | "clerk";

const VALID_PROVIDERS: AuthProvider[] = ["supabase", "clerk"];

/**
 * Default: supabase — native integration with Supabase RLS, Storage, and Edge Functions.
 * Set NEXT_PUBLIC_AUTH_PROVIDER=clerk to use Clerk instead.
 */
export function getAuthProvider(): AuthProvider {
  const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER ?? "supabase";

  if (!VALID_PROVIDERS.includes(provider as AuthProvider)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_AUTH_PROVIDER: "${provider}". Use "supabase" or "clerk".`,
    );
  }

  return provider as AuthProvider;
}

export function isSupabaseAuth(): boolean {
  return getAuthProvider() === "supabase";
}

export function isClerkAuth(): boolean {
  return getAuthProvider() === "clerk";
}
