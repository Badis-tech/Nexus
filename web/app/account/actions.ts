"use server";

import { redirect } from "next/navigation";
import { cleanError, requireViewer, withMessage } from "@/lib/auth";
import { getCategories } from "@/lib/categories";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function updateProfile(formData: FormData) {
  const { supabase, userId } = await requireViewer();
  const categories = await getCategories();
  const skills = formData.getAll("skills").map(String).filter((s) => categories.includes(s));
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: str(formData, "full_name"),
      city: str(formData, "city"),
      bio: str(formData, "bio"),
      skills,
    })
    .eq("id", userId);
  if (error) redirect(withMessage("/account", "error", cleanError(error)));
  const contact = await supabase
    .from("private_contacts")
    .update({ phone: str(formData, "phone") })
    .eq("user_id", userId);
  if (contact.error) redirect(withMessage("/account", "error", cleanError(contact.error)));
  redirect(withMessage("/account", "notice", "Profile saved."));
}

export async function changePassword(formData: FormData) {
  const { supabase, email } = await requireViewer();
  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    redirect(withMessage("/account", "error", "Use a password of at least 8 characters."));
  }
  // Ask for the current password again, so an unattended open session cannot
  // be used to take over the account.
  const check = await supabase.auth.signInWithPassword({ email: email ?? "", password: current });
  if (check.error) redirect(withMessage("/account", "error", "Your current password is wrong."));
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(withMessage("/account", "error", error.message));
  redirect(withMessage("/account", "notice", "Password changed."));
}

export async function changeEmail(formData: FormData) {
  const { supabase, email } = await requireViewer();
  const next = str(formData, "email");
  if (!next || next === email) redirect(withMessage("/account", "error", "Enter a different email address."));
  const { error } = await supabase.auth.updateUser({ email: next });
  if (error) redirect(withMessage("/account", "error", error.message));
  redirect(withMessage("/account", "notice", "Check your inbox to confirm the new email address."));
}

// TEST MODE: no money moves. Swap this for a real checkout + webhook later.
export async function changePlan(formData: FormData) {
  const { supabase } = await requireViewer();
  const plan = str(formData, "plan");
  const { error } = await supabase.rpc("change_plan_test", { p_plan: plan });
  if (error) redirect(withMessage("/pricing", "error", cleanError(error)));
  redirect(
    withMessage("/account", "notice", plan === "pro" ? "You are on Pro (test payment, no charge)." : "You are back on the Free plan."),
  );
}

export async function deleteAccount(formData: FormData) {
  const { supabase } = await requireViewer();
  if (str(formData, "confirm") !== "DELETE") {
    redirect(withMessage("/account", "error", "Type DELETE to confirm."));
  }
  const { error } = await supabase.rpc("delete_my_account");
  if (error) redirect(withMessage("/account", "error", cleanError(error)));
  await supabase.auth.signOut();
  redirect(withMessage("/", "notice", "Your account was deleted."));
}
