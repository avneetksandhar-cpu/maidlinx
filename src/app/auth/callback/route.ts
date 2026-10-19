import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureCleanerApplicant,
  wantsCleanerApplicant,
} from "@/lib/auth/cleaner-applicant";
import { oauthRoleFromParams, safeAuthNextPath } from "@/lib/auth/oauth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeAuthNextPath(searchParams.get("next"), "/account");
  const roleHint = oauthRoleFromParams({
    role: searchParams.get("role"),
    next,
  });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        const metadataRole =
          typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null;

        const cleanerIntent = wantsCleanerApplicant({
          metadataRole,
          nextPath: next,
          explicit: roleHint === "cleaner",
        });

        if (cleanerIntent) {
          // Persist role in auth metadata so handle_new_user / getSession heal paths see it.
          if (metadataRole !== "cleaner") {
            try {
              await supabase.auth.updateUser({ data: { role: "cleaner" } });
            } catch (err) {
              console.error("[auth/callback] failed to set cleaner metadata", err);
            }
          }

          const meta = user.user_metadata ?? {};
          const fullName =
            typeof meta.full_name === "string"
              ? meta.full_name
              : typeof meta.name === "string"
                ? meta.name
                : "";
          const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
          const firstName =
            (typeof meta.first_name === "string" ? meta.first_name : null) ??
            nameParts[0] ??
            null;
          const lastName =
            (typeof meta.last_name === "string" ? meta.last_name : null) ??
            (nameParts.length > 1 ? nameParts.slice(1).join(" ") : null);
          const avatarUrl =
            typeof meta.avatar_url === "string"
              ? meta.avatar_url
              : typeof meta.picture === "string"
                ? meta.picture
                : null;

          try {
            await ensureCleanerApplicant({
              userId: user.id,
              email: user.email,
              firstName,
              lastName,
              avatarUrl,
            });
          } catch (err) {
            console.error("[auth/callback] cleaner applicant bootstrap failed", err);
          }
        }
      }

      const destination =
        roleHint === "cleaner" && (next === "/account" || !next.startsWith("/cleaner"))
          ? "/cleaner/application"
          : next;

      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
