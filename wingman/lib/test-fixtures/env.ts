export function testFixturesEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const raw = (env.ENABLE_TEST_FIXTURES ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function testFixturesBlocker(): string {
  return "Private TEST fixtures are disabled. Set ENABLE_TEST_FIXTURES=true in .env.local for admin/test mode only.";
}
