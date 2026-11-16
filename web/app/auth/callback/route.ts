import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

// Email links (confirm sign-up, reset password, change email) land here with
// a `code` that we exchange for a session.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  // Internal paths only, to prevent open redirects.
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

  if (code) {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Supabase tells us when the code came from a password-reset email, even
      // if it dropped our `next` parameter.
      const recovery = (data as { redirectType?: string | null }).redirectType === "PASSWORD_RECOVERY";
      return NextResponse.redirect(new URL(recovery ? "/reset-password" : next ?? "/dashboard", url.origin));
    }
  }
  return NextResponse.redirect(
    new URL(
      "/login?error=" + encodeURIComponent("That link has expired or was opened in a different browser. Request a new one."),
      url.origin,
    ),
  );
}
