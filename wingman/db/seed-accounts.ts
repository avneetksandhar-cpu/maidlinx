import type { UserRole } from "../lib/auth/types";

/** Gmail plus-aliases so all seed roles land in the same inbox. Password lives in `.env.local`. */
export const SEED_ACCOUNTS: Array<{
  email: string;
  role: UserRole;
  name: string;
}> = [
  { email: "wingmanworldgroup+member@gmail.com", role: "member", name: "Wingman Member" },
  { email: "wingmanworldgroup+partner@gmail.com", role: "partner", name: "Wingman Partner" },
  { email: "wingmanworldgroup+admin@gmail.com", role: "admin", name: "Wingman Admin" },
  { email: "wingmanworldgroup@gmail.com", role: "owner", name: "Wingman Owner" },
];

export const LEGACY_SEED_EMAILS = [
  "sprint1.member@wingman.test",
  "sprint1.partner@wingman.test",
  "sprint1.admin@wingman.test",
];

export function seedEmailForRole(role: UserRole): string {
  const match = SEED_ACCOUNTS.find((account) => account.role === role);
  if (!match) {
    throw new Error(`No seed account for role ${role}`);
  }
  return match.email;
}
