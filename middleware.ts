import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Cleaned up public routes — removed the obsolete pending route
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/verify",
  "/resubmit-verification",
  "/forgot-password",
  "/reset-password",
  "/sellers",
];
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. QUICK SAFETY EXIT: If it's an API route, completely bypass Supabase checks
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect Private Dashboard Routes
  if (!isPublicRoute(pathname)) {
    // 1. Redirect unauthenticated users straight to login
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // 2. Intercept authenticated users who haven't completed OTP verification
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_verified) {
      const url = request.nextUrl.clone();
      url.pathname = "/verify"; // Redirects them to the verification form screen instead!
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

// 2. UPDATED MATCHER: Added "api to the ignore patterns for maximum safety
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};