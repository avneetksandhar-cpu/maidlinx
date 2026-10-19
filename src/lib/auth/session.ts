import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ensureProfileForUser,
  promoteBootstrapAdminIfNeeded,
} from "@/lib/auth/profiles";
import {
  ensureCleanerApplicant,
  wantsCleanerApplicant,
} from "@/lib/auth/cleaner-applicant";
import { normalizeRole, roleMatches } from "@/lib/auth/roles";
import type { AuthSession, UserRole } from "@/lib/auth/types";
import { hasSupabaseEnv } from "@/config/env";
import { hasAdminEnv } from "@/lib/supabase/admin";

export async function getSession(): Promise<AuthSession | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, role, first_name, last_name, phone, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const email = user.email ?? "";
  const metadataRole =
    typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null;

  let profile = profileRow
    ? {
        id: profileRow.id,
        role: normalizeRole(profileRow.role),
        firstName: profileRow.first_name,
        lastName: profileRow.last_name,
        phone: profileRow.phone,
        avatarUrl: profileRow.avatar_url,
      }
    : await ensureProfileForUser({
        userId: user.id,
        email,
        firstName: user.user_metadata?.first_name ?? null,
        lastName: user.user_metadata?.last_name ?? null,
        role: normalizeRole(metadataRole),
      });

  // Heal cleaner signup race: metadata says cleaner but DB row is still customer.
  if (
    profile.role === "customer" &&
    wantsCleanerApplicant({ metadataRole }) &&
    hasAdminEnv()
  ) {
    try {
      const healed = await ensureCleanerApplicant({
        userId: user.id,
        email,
        firstName: user.user_metadata?.first_name ?? null,
        lastName: user.user_metadata?.last_name ?? null,
      });
      profile = { ...profile, role: healed.role === "admin" ? "admin" : "cleaner" };
    } catch {
      // Leave as customer; caller/UI can retry via /api/auth/cleaner-applicant.
    }
  }

  // Existing accounts that match ADMIN_BOOTSTRAP_EMAIL may still be customer
  // if they signed up before bootstrap was set. Self-heal server-side only.
  if (profileRow) {
    profile = await promoteBootstrapAdminIfNeeded({
      userId: user.id,
      email,
      profile,
    });
  }

  return {
    user: {
      id: user.id,
      email,
    },
    profile,
  };
}

export async function requireSession(redirectTo = "/sign-in"): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    redirect(redirectTo);
  }
  return session;
}

export async function requireRole(
  allowed: UserRole[],
  redirectTo = "/",
): Promise<AuthSession> {
  const session = await requireSession();
  const role = session.profile?.role ?? "customer";

  if (!roleMatches(allowed, role)) {
    redirect(redirectTo);
  }

  return session;
}
