"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { requireViewer, withMessage } from "@/lib/auth";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

// Supabase limits how many emails a project can send per hour.
const EMAIL_LIMIT = "We cannot send more emails right now. Please try again in about an hour.";
const isEmailLimit = (e: { status?: number; code?: string } | null) =>
  e?.status === 429 || e?.code === "over_email_send_rate_limit";

export async function signUp(formData: FormData) {
  const email = str(formData, "email");
  const password = String(formData.get("password") ?? "");
  const role = str(formData, "role");
  const fullName = str(formData, "full_name");
  const city = str(formData, "city");

  if (!["worker", "employer", "volunteer"].includes(role)) {
    redirect(withMessage("/signup", "error", "Choose what kind of account you want."));
  }
  if (!fullName) redirect(withMessage("/signup", "error", "Enter your name."));
  if (password.length < 8) {
    redirect(withMessage("/signup", "error", "Use a password of at least 8 characters."));
  }

  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host")}`;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, full_name: fullName, city },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (isEmailLimit(error)) redirect(withMessage("/signup", "error", EMAIL_LIMIT));
  if (error) redirect(withMessage("/signup", "error", error.message));
  if (data.session) redirect("/dashboard");
  // Supabase answers the same way for an email that already has an account
  // (and sends nothing), so the message has to cover both cases.
  redirect(
    withMessage(
      "/login",
      "notice",
      "Check your email for a confirmation link. If you already had an account with this email, no email is sent: log in, or use Forgot your password.",
    ),
  );
}

export async function signIn(formData: FormData) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({
    email: str(formData, "email"),
    password: String(formData.get("password") ?? ""),
  });
  if (error?.code === "email_not_confirmed") {
    redirect(
      withMessage("/resend-confirmation", "error", "Your email is not confirmed yet. Open the link we sent you, or get a new one below."),
    );
  }
  if (error) redirect(withMessage("/login", "error", "Wrong email or password."));
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}

// Always answers the same way, so this cannot be used to find out which
// emails have an account.
export async function requestPasswordReset(formData: FormData) {
  const email = str(formData, "email");
  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host")}`;
  const supabase = await createSupabaseServer();
  if (email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
    if (isEmailLimit(error)) redirect(withMessage("/forgot-password", "error", EMAIL_LIMIT));
  }
  redirect(
    withMessage("/forgot-password", "notice", "If that email has an account, a reset link is on its way. Open it in this browser."),
  );
}

// Reached through the emailed link, which signs the user in first.
export async function resetPassword(formData: FormData) {
  const { supabase } = await requireViewer();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    redirect(withMessage("/reset-password", "error", "Use a password of at least 8 characters."));
  }
  if (password !== String(formData.get("confirm") ?? "")) {
    redirect(withMessage("/reset-password", "error", "The two passwords do not match."));
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(withMessage("/reset-password", "error", error.message));
  redirect(withMessage("/dashboard", "notice", "Password changed. You are logged in."));
}

// Sends the sign-up confirmation email again. Same answer whether or not the
// address has an account waiting, so it reveals nothing.
export async function resendConfirmation(formData: FormData) {
  const email = str(formData, "email");
  const h = await headers();
  const origin = h.get("origin") ?? `http://${h.get("host")}`;
  const supabase = await createSupabaseServer();
  let limited = false;
  if (email) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    limited = isEmailLimit(error);
  }
  if (limited) {
    redirect(withMessage("/resend-confirmation", "error", EMAIL_LIMIT));
  }
  redirect(
    withMessage("/resend-confirmation", "notice", "If that email has an account waiting for confirmation, a new link is on its way. Check spam too."),
  );
}
