import {
  accountDeletionConfirmed,
  softDeleteAccount,
} from "@/lib/account/delete";
import { getSession } from "@/lib/auth/session";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/auth/roles";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return jsonError("Authentication required.", 401);
  }

  let confirm: unknown;
  try {
    confirm = ((await request.json()) as { confirm?: unknown }).confirm;
  } catch {
    return jsonError("Type DELETE to confirm.", 400);
  }

  if (!accountDeletionConfirmed(confirm)) {
    return jsonError("Type DELETE to confirm.", 400);
  }

  const role = normalizeRole(session.profile?.role);
  const result = await softDeleteAccount({
    userId: session.user.id,
    role,
  });

  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Client also signs out after success; ignore server cookie races.
  }

  return jsonSuccess({ ok: true });
}

/** GET is not supported — deletion requires explicit POST + confirm. */
export async function GET() {
  return jsonSuccess({
    confirmPhrase: "DELETE",
    path: "/dashboard/profile/delete",
  });
}
