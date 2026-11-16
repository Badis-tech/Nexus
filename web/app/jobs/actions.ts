"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cleanError, requireViewer, withMessage } from "@/lib/auth";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function createJob(formData: FormData) {
  const { supabase, userId } = await requireViewer();
  const isVolunteer = formData.get("is_volunteer") === "on";
  const budgetRaw = str(formData, "budget");
  const budget = isVolunteer || budgetRaw === "" ? null : Number(budgetRaw);
  const category = str(formData, "category");

  if (!category) redirect(withMessage("/jobs/new", "error", "Choose a category."));
  if (budget !== null && (!Number.isFinite(budget) || budget < 0)) {
    redirect(withMessage("/jobs/new", "error", "Budget must be a positive number, or left empty."));
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      employer_id: userId,
      title: str(formData, "title"),
      description: str(formData, "description"),
      category,
      city: str(formData, "city"),
      budget,
      is_volunteer: isVolunteer,
    })
    .select("id")
    .single();
  if (error) redirect(withMessage("/jobs/new", "error", cleanError(error)));
  revalidatePath("/");
  redirect(withMessage(`/jobs/${data.id}`, "notice", "Your job is live."));
}

export async function setJobStatus(formData: FormData) {
  const { supabase } = await requireViewer();
  const id = str(formData, "job_id");
  const status = str(formData, "status");
  // The database checks ownership and which changes are allowed.
  const { error } = await supabase.rpc("set_job_status", { p_job: id, p_status: status });
  if (error) redirect(withMessage(`/jobs/${id}`, "error", cleanError(error)));
  redirect(
    withMessage(`/jobs/${id}`, "notice", status === "done" ? "Job marked as done. You can now leave a review." : `Job marked as ${status}.`),
  );
}

export async function deleteJob(formData: FormData) {
  const { supabase } = await requireViewer();
  const id = str(formData, "job_id");
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) redirect(withMessage(`/jobs/${id}`, "error", cleanError(error)));
  redirect(withMessage("/dashboard", "notice", "Job deleted."));
}

export async function applyToJob(formData: FormData) {
  const { supabase, userId } = await requireViewer();
  const id = str(formData, "job_id");
  const { error } = await supabase
    .from("applications")
    .insert({ job_id: id, applicant_id: userId, message: str(formData, "message") });
  if (error) redirect(withMessage(`/jobs/${id}`, "error", cleanError(error)));
  redirect(withMessage(`/jobs/${id}`, "notice", "Sent. The employer will see your request."));
}

export async function withdrawApplication(formData: FormData) {
  const { supabase } = await requireViewer();
  const back = str(formData, "back") === "dashboard" ? "/dashboard" : `/jobs/${str(formData, "job_id")}`;
  const { error } = await supabase.rpc("withdraw_application", { p_application: str(formData, "application_id") });
  if (error) redirect(withMessage(back, "error", cleanError(error)));
  redirect(withMessage(back, "notice", "Request withdrawn."));
}

export async function submitReview(formData: FormData) {
  const { supabase } = await requireViewer();
  const jobId = str(formData, "job_id");
  const { error } = await supabase.rpc("submit_review", {
    p_job: jobId,
    p_reviewee: str(formData, "reviewee_id"),
    p_rating: Number(str(formData, "rating")),
    p_comment: str(formData, "comment"),
  });
  if (error) redirect(withMessage(`/jobs/${jobId}`, "error", cleanError(error)));
  redirect(withMessage(`/jobs/${jobId}`, "notice", "Thanks. Your review is published."));
}

export async function decideApplication(formData: FormData) {
  const { supabase } = await requireViewer();
  const jobId = str(formData, "job_id");
  const accept = str(formData, "decision") === "accept";
  const { error } = await supabase.rpc("decide_application", {
    p_application: str(formData, "application_id"),
    p_accept: accept,
  });
  if (error) redirect(withMessage(`/jobs/${jobId}`, "error", cleanError(error)));
  redirect(withMessage(`/jobs/${jobId}`, "notice", accept ? "Accepted. You can now see their phone number." : "Declined."));
}
