import { redirect } from "next/navigation";
import { createSupabaseServer } from "./supabase-server";
import type { Profile } from "./site";

// Who is signed in, plus their profile row. getClaims() checks the session
// token locally when it can, so this is cheap to call on every page.
export async function getViewer() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;
  const userId = (claims?.sub as string) ?? null;
  const email = (claims?.email as string) ?? null;
  let profile: Profile | null = null;
  if (userId) {
    const res = await supabase
      .from("profiles")
      .select("id, role, full_name, city, bio, skills, plan, created_at")
      .eq("id", userId)
      .maybeSingle();
    profile = (res.data as Profile | null) ?? null;
  }
  return { supabase, userId, email, profile };
}

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer.userId || !viewer.profile) redirect("/login");
  return { ...viewer, userId: viewer.userId, profile: viewer.profile };
}

// Database errors are raised as "CODE: message for the user".
export function cleanError(error: { message: string; code?: string } | null | undefined) {
  if (!error) return "Something went wrong. Please try again.";
  if (error.code === "23505") return "You have already done that.";
  const m = error.message.match(/^[A-Z_]+: (.+)$/);
  if (m) return m[1];
  if (error.code === "42501") return "You are not allowed to do that.";
  return "Something went wrong. Please try again.";
}

export function withMessage(path: string, kind: "error" | "notice", message: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${kind}=${encodeURIComponent(message)}`;
}

// Start of the current calendar month (UTC), matching date_trunc('month', now()).
export function monthStart() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}
