import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureCleanerApplicant,
  wantsCleanerApplicant,
} from "@/lib/auth/cleaner-applicant";

function safeNextPath(next: string | null, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return fallback;
  }
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), "/account");

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

        if (
          wantsCleanerApplicant({
            metadataRole,
            nextPath: next,
          })
        ) {
          try {
            await ensureCleanerApplicant({
              userId: user.id,
              email: user.email,
              firstName: user.user_metadata?.first_name ?? null,
              lastName: user.user_metadata?.last_name ?? null,
            });
          } catch (err) {
            console.error("[auth/callback] cleaner applicant bootstrap failed", err);
          }
        }
      }

      const destination =
        wantsCleanerApplicant({
          metadataRole:
            typeof user?.user_metadata?.role === "string"
              ? user.user_metadata.role
              : null,
          nextPath: next,
        }) && next === "/account"
          ? "/cleaner/application"
          : next;

      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
