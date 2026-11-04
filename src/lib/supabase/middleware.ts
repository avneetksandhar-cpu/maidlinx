import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/config/env";
import { normalizeRole } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/auth/types";

const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];
const CUSTOMER_PREFIXES = ["/dashboard", "/account"];
const CLEANER_PREFIXES = ["/cleaner", "/pro"];
const CLEANER_API_PREFIXES = ["/api/cleaner", "/api/pro"];
const ADMIN_PREFIXES = ["/admin"];
const ADMIN_API_PREFIXES = ["/api/admin"];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function homeForRole(role: UserRole): string {
  if (role === "admin") return "/admin";
  if (role === "cleaner") return "/cleaner";
  return "/account";
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const needsAuth =
    matchesPrefix(pathname, CUSTOMER_PREFIXES) ||
    matchesPrefix(pathname, CLEANER_PREFIXES) ||
    matchesPrefix(pathname, CLEANER_API_PREFIXES) ||
    matchesPrefix(pathname, ADMIN_PREFIXES) ||
    matchesPrefix(pathname, ADMIN_API_PREFIXES);

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  // Fail closed for protected routes when Supabase is not configured.
  if (!url || !anonKey) {
    if (needsAuth) {
      if (
        matchesPrefix(pathname, CLEANER_API_PREFIXES) ||
        matchesPrefix(pathname, ADMIN_API_PREFIXES)
      ) {
        return NextResponse.json(
          { error: "Sign-in is temporarily unavailable. Please try again shortly." },
          { status: 503 },
        );
      }
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/sign-in";
      redirectUrl.searchParams.set("next", pathname);
      redirectUrl.searchParams.set("error", "auth_not_configured");
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && needsAuth) {
    if (
      matchesPrefix(pathname, CLEANER_API_PREFIXES) ||
      matchesPrefix(pathname, ADMIN_API_PREFIXES)
    ) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (needsAuth || isAuthRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = normalizeRole(profile?.role);

    if (isAuthRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = homeForRole(role);
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (matchesPrefix(pathname, ADMIN_PREFIXES) && role !== "admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = homeForRole(role);
      return NextResponse.redirect(redirectUrl);
    }

    if (matchesPrefix(pathname, ADMIN_API_PREFIXES) && role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (matchesPrefix(pathname, CLEANER_PREFIXES) && role !== "cleaner" && role !== "admin") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = homeForRole(role);
      return NextResponse.redirect(redirectUrl);
    }

    if (matchesPrefix(pathname, CLEANER_API_PREFIXES) && role !== "cleaner" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (matchesPrefix(pathname, CUSTOMER_PREFIXES) && role === "cleaner") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/cleaner";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
