import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/access";
import { deleteSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const match = cookieHeader?.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  const token = match?.[1] ? decodeURIComponent(match[1]) : null;

  if (token) {
    try {
      await deleteSession(token);
    } catch {
      // Still clear the cookie even if the row is already gone.
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
