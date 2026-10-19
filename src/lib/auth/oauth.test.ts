import { describe, expect, it } from "vitest";
import {
  buildOAuthRedirectTo,
  isOAuthProvider,
  oauthRoleFromParams,
  safeAuthNextPath,
  SUPABASE_OAUTH_REDIRECT_ALLOWLIST,
} from "@/lib/auth/oauth";

describe("oauth helpers", () => {
  it("accepts google and apple only", () => {
    expect(isOAuthProvider("google")).toBe(true);
    expect(isOAuthProvider("apple")).toBe(true);
    expect(isOAuthProvider("github")).toBe(false);
  });

  it("blocks open redirects", () => {
    expect(safeAuthNextPath("https://evil.example/phish")).toBe("/account");
    expect(safeAuthNextPath("//evil.example")).toBe("/account");
    expect(safeAuthNextPath("/cleaner/application")).toBe("/cleaner/application");
  });

  it("infers cleaner role from next path", () => {
    expect(oauthRoleFromParams({ next: "/cleaner/application" })).toBe("cleaner");
    expect(oauthRoleFromParams({ role: "cleaner", next: "/account" })).toBe("cleaner");
    expect(oauthRoleFromParams({ next: "/account" })).toBe("customer");
  });

  it("builds callback redirectTo with role for cleaners", () => {
    const url = buildOAuthRedirectTo("http://127.0.0.1:3001", {
      next: "/cleaner/application",
      role: "cleaner",
    });
    expect(url).toBe(
      "http://127.0.0.1:3001/auth/callback?next=%2Fcleaner%2Fapplication&role=cleaner",
    );
  });

  it("documents local + production + preview allowlist entries", () => {
    expect(SUPABASE_OAUTH_REDIRECT_ALLOWLIST.join("\n")).toContain("127.0.0.1:3001");
    expect(SUPABASE_OAUTH_REDIRECT_ALLOWLIST.join("\n")).toContain("maidlinx.com");
    expect(SUPABASE_OAUTH_REDIRECT_ALLOWLIST.join("\n")).toContain("vercel.app");
  });
});
