import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  canAccessPath,
  isProtectedPath,
  isPublicPath,
} from "@/lib/auth/access";
import { getUserFromSessionToken } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let user = null;

  try {
    user = await getUserFromSessionToken(token);
  } catch {
    user = null;
  }

  const isAuthRoute = pathname === "/auth" || pathname.startsWith("/auth/");
  const isResetRoute = pathname.startsWith("/auth/reset");
  const isApiAuth = pathname.startsWith("/api/auth");

  if (isApiAuth) {
    return NextResponse.next();
  }

  if (user && isAuthRoute && !isResetRoute) {
    const home = request.nextUrl.clone();
    home.pathname = "/home";
    home.search = "";
    return NextResponse.redirect(home);
  }

  if (!isProtectedPath(pathname)) {
    if (isPublicPath(pathname) || pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
  }

  if (isProtectedPath(pathname)) {
    if (!user || user.approvalStatus === "suspended") {
      const login = request.nextUrl.clone();
      login.pathname = "/auth";
      login.searchParams.set("next", pathname);
      const response = NextResponse.redirect(login);
      if (token && !user) {
        response.cookies.delete(SESSION_COOKIE);
      }
      return response;
    }

    if (!canAccessPath(user.role, pathname)) {
      const forbidden = request.nextUrl.clone();
      forbidden.pathname = "/forbidden";
      forbidden.search = "";
      return NextResponse.redirect(forbidden);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
