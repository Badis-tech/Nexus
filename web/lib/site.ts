// Placeholder product name: change it here and it changes everywhere.
export const SITE_NAME = "Service Platform";

export type Role = "worker" | "employer" | "volunteer";
export type Plan = "free" | "pro";

export const ROLES: { value: Role; label: string; blurb: string }[] = [
  { value: "employer", label: "Employer", blurb: "I need a job done and want to post it." },
  { value: "worker", label: "Worker", blurb: "I offer a service and want paid jobs." },
  { value: "volunteer", label: "Volunteer", blurb: "I want to help on community jobs for free." },
];

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  city: string;
  bio: string;
  skills: string[];
  plan: Plan;
  created_at: string;
}

// Read model kept by the database (public.user_stats). Never computed in the app.
export interface Stats {
  score: number;
  rating_avg: number | null;
  rating_count: number;
  jobs_completed: number;
}
export const STATS_COLUMNS = "score, rating_avg, rating_count, jobs_completed";
export const CARD_COLUMNS = `id, full_name, role, city, created_at, stats:user_stats(${STATS_COLUMNS})`;

export interface CardUser {
  id: string;
  full_name: string;
  role: Role;
  city: string;
  created_at: string;
  stats: Stats | null;
}

export function tier(jobsCompleted: number) {
  if (jobsCompleted >= 20) return "Expert";
  if (jobsCompleted >= 5) return "Established";
  if (jobsCompleted >= 1) return "Getting started";
  return "New";
}

// Everything except the full-text `search` column.
export const JOB_COLUMNS =
  "id, employer_id, title, description, category, city, budget, is_volunteer, status, created_at";

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  budget: number | null;
  is_volunteer: boolean;
  status: "open" | "assigned" | "done" | "cancelled";
  created_at: string;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatBudget(job: Pick<Job, "budget" | "is_volunteer">) {
  if (job.is_volunteer) return "Volunteer";
  if (job.budget == null) return "Budget to agree";
  return `${Number(job.budget).toLocaleString("en-GB")} ${CURRENCY}`;
}

export const CURRENCY = "TND";
