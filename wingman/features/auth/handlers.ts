import type { AuthHandler, AuthMethod } from "./types";

/**
 * Stub auth handlers — wire to Supabase or Clerk when credentials are configured.
 */
export async function handleAuth(method: AuthMethod): Promise<void> {
  console.info(`[Wingman Auth] ${method} sign-in requested (stub)`);

  // Simulate network delay for UX testing
  await new Promise((resolve) => setTimeout(resolve, 800));

  switch (method) {
    case "apple":
      // TODO: supabase.auth.signInWithOAuth({ provider: 'apple' })
      // TODO: clerk.signIn.authenticateWithRedirect({ strategy: 'oauth_apple' })
      break;
    case "google":
      // TODO: supabase.auth.signInWithOAuth({ provider: 'google' })
      // TODO: clerk.signIn.authenticateWithRedirect({ strategy: 'oauth_google' })
      break;
    case "email":
      // TODO: navigate to email form or open modal
      break;
  }
}

export const authHandler: AuthHandler = handleAuth;
