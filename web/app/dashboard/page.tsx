import Link from "next/link";
import { requireViewer, monthStart } from "@/lib/auth";
import { Flash, type PageParams } from "@/components/flash";
import { JobCard } from "@/components/job-card";
import { withdrawApplication } from "@/app/jobs/actions";
import { MONTHLY_LIMIT } from "@/lib/plans";
import { CARD_COLUMNS, JOB_COLUMNS, type CardUser, type Job } from "@/lib/site";
import { UserCard } from "@/components/user-card";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: PageParams }) {
  const { supabase, userId, profile } = await requireViewer();
  const limit = profile.plan === "free" ? MONTHLY_LIMIT[profile.role] : null;
  const { data: me } = await supabase.from("profiles").select(CARD_COLUMNS).eq("id", userId).maybeSingle();

  let body: React.ReactNode;
  let used = 0;

  if (profile.role === "employer") {
    const { data } = await supabase
      .from("jobs")
      .select(`${JOB_COLUMNS}, applications(count)`)
      .eq("employer_id", userId)
      .order("created_at", { ascending: false });
    const jobs = (data ?? []) as (Job & { applications: { count: number }[] })[];
    used = jobs.filter((j) => j.created_at >= monthStart()).length;
    body =
      jobs.length === 0 ? (
        <div className="card text-sm">
          <p>You have not posted a job yet.</p>
          <Link href="/jobs/new" className="btn mt-3">Post a job</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              extra={<p className="text-sm text-slate-600">{job.applications[0]?.count ?? 0} request(s)</p>}
            />
          ))}
        </ul>
      );
  } else {
    const { data } = await supabase
      .from("applications")
      .select(`id, status, created_at, job:jobs(${JOB_COLUMNS})`)
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false });
    const apps = (data ?? []) as unknown as { id: string; status: string; created_at: string; job: Job | null }[];
    used = apps.filter((a) => a.created_at >= monthStart()).length;
    body =
      apps.length === 0 ? (
        <div className="card text-sm">
          <p>You have not {profile.role === "volunteer" ? "joined" : "applied to"} a job yet.</p>
          <Link href="/" className="btn mt-3">Browse jobs</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {apps.map((a) =>
            a.job ? (
              <JobCard
                key={a.id}
                job={a.job}
                extra={
                  <div className="flex items-center gap-3 text-sm">
                    <span>Your request: <span className="font-medium">{a.status}</span></span>
                    {(a.status === "pending" || (a.status === "accepted" && a.job.status !== "done" && a.job.status !== "cancelled")) && (
                      <form action={withdrawApplication}>
                        <input type="hidden" name="application_id" value={a.id} />
                        <input type="hidden" name="back" value="dashboard" />
                        <button className="text-brand underline" type="submit">
                          {a.status === "accepted" ? "Back out (lowers your score)" : "Withdraw"}
                        </button>
                      </form>
                    )}
                  </div>
                }
              />
            ) : null,
          )}
        </ul>
      );
  }

  return (
    <>
      <Flash params={await searchParams} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {profile.role === "employer" ? "Your jobs" : profile.role === "volunteer" ? "Jobs you joined" : "Your applications"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {profile.full_name || "Welcome"} · {profile.role} · {profile.plan === "pro" ? "Pro plan" : "Free plan"}
          </p>
        </div>
        {limit != null && (
          <p className="text-sm text-slate-600">
            {used} of {limit} {profile.role === "employer" ? "posts" : "applications"} used this month.{" "}
            <Link href="/pricing" className="text-brand underline">Upgrade</Link>
          </p>
        )}
      </div>
      {me && (
        <div className="mb-6">
          <UserCard user={me as unknown as CardUser} />
        </div>
      )}
      {body}
    </>
  );
}
