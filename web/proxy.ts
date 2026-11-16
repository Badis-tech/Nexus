import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next 16 renamed `middleware` -> `proxy`. This refreshes the Supabase auth
// session cookie on every matched request so server components always see a
// valid session. It does not gate routes;
// pages and row level security do that.
export async function proxy(request: NextRequest) {
  // Supabase falls back to the site root when a redirect URL is not on its
  // allow list, so an email link can land on any page with ?code=. Hand it to
  // the callback route, which exchanges it for a session.
  const { pathname, searchParams } = request.nextUrl;
  if (searchParams.has("code") && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Validate the session locally (ES256 JWKS) — no network round-trip. This
  // keeps the auth cookie fresh for server components without the ~250ms hit
  // of a getUser() call to the auth server on every request.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  // Run on everything except static assets and image optimization.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
