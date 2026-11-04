import type { AuthHandler, AuthMethod } from "./types";

/**
 * Social auth is not in Sprint 1. Email/password lives in AuthScreen + /api/auth/*.
 */
export async function handleAuth(_method: AuthMethod): Promise<void> {
  throw new Error("Social sign-in is not available yet. Use email and password.");
}

export const authHandler: AuthHandler = handleAuth;
