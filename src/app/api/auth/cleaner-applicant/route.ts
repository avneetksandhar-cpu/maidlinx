import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureCleanerApplicant,
  wantsCleanerApplicant,
} from "@/lib/auth/cleaner-applicant";
import { jsonError, jsonSuccess } from "@/lib/api/response";

/**
 * POST — finalize cleaner applicant role after signup/sign-in.
 * Intentionally NOT under /api/cleaner (middleware would 403 customers).
 * Does not approve or activate supply.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return jsonError("Authentication required.", 401);
    }

    let body: { explicit?: boolean; next?: string } = {};
    try {
      body = (await request.json()) as { explicit?: boolean; next?: string };
    } catch {
      body = {};
    }

    const metadataRole =
      typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null;

    if (
      !wantsCleanerApplicant({
        metadataRole,
        nextPath: body.next ?? null,
        explicit: Boolean(body.explicit),
      })
    ) {
      return jsonError("Cleaner applicant intent required.", 400);
    }

    const result = await ensureCleanerApplicant({
      userId: user.id,
      email: user.email,
      firstName: user.user_metadata?.first_name ?? null,
      lastName: user.user_metadata?.last_name ?? null,
    });

    return jsonSuccess({
      role: result.role,
      professionalId: result.professionalId,
      upgraded: result.upgraded,
      created: result.created,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to start cleaner application.",
      400,
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
