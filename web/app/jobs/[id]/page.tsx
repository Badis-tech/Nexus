import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { Flash, type PageParams } from "@/components/flash";
import { UserCard } from "@/components/user-card";
import { CARD_COLUMNS, JOB_COLUMNS, formatBudget, formatDate, type CardUser, type Job } from "@/lib/site";
import {
  applyToJob,
  decideApplication,
  deleteJob,
  setJobStatus,
  submitReview,
  withdrawApplication,
} from "@/app/jobs/actions";

interface Applicant {
  id: string;
  applicant_id: string;
  message: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn" | "dropped";
  created_at: string;
  applicant: (CardUser & { bio: string; skills: string[] }) | null;
}

const STATUS_LABEL: Record<Applicant["status"], string> = {
  pending: "waiting for an answer",
  accepted: "accepted",
  rejected: "declined",
  withdrawn: "withdrawn",
  dropped: "backed out",
};

function ReviewForm({ jobId, revieweeId, name }: { jobId: string; revieweeId: string; name: string }) {
  return (
    <form action={submitReview} className="space-y-3">
      <input type="hidden" name="job_id" value={jobId} />
      <input type="hidden" name="reviewee_id" value={revieweeId} />
      <fieldset>
        <legend className="label">How was working with {name}?</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm has-checked:border-brand has-checked:bg-teal-50">
              <input type="radio" name="rating" value={n} required />
              {n} <span aria-hidden className="text-amber-500">★</span>
              <span className="sr-only">star{n === 1 ? "" : "s"}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor={`comment-${revieweeId}`}>Comment (optional, public)</label>
        <textarea className="input" id={`comment-${revieweeId}`} name="comment" rows={2} maxLength={1000} />
      </div>
      <button className="btn" type="submit">Publish review</button>
      <p className="text-xs text-slate-500">Reviews are public and cannot be edited afterwards.</p>
    </form>
  );
}

export default async function JobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: PageParams;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, userId, profile } = await getViewer();

  const { data } = await supabase.from("jobs").select(JOB_COLUMNS).eq("id", id).maybeSingle();
  const job = data as unknown as Job | null;
  if (!job) notFound();

  const { data: employerRow } = await supabase
    .from("profiles")
    .select(CARD_COLUMNS)
    .eq("id", job.employer_id)
    .maybeSingle();
  const employer = employerRow as unknown as CardUser | null;

  const isOwner = userId === job.employer_id;

  // Row level security decides what comes back: the owner sees every request,
  // an applicant sees only their own.
  let applications: Applicant[] = [];
  const reviewed = new Set<string>();
  if (userId) {
    const [apps, mineReviews] = await Promise.all([
      supabase
        .from("applications")
        .select(`id, applicant_id, message, status, created_at, applicant:profiles(${CARD_COLUMNS}, bio, skills)`)
        .eq("job_id", id)
        .order("created_at"),
      supabase.from("reviews").select("reviewee_id").eq("job_id", id).eq("reviewer_id", userId),
    ]);
    applications = (apps.data ?? []) as unknown as Applicant[];
    for (const r of mineReviews.data ?? []) reviewed.add(r.reviewee_id);
  }
  const mine = applications.find((a) => a.applicant_id === userId) ?? null;

  // Phone numbers are only readable once a request is accepted.
  const phones = new Map<string, string>();
  const accepted = applications.filter((a) => a.status === "accepted");
  if (accepted.length > 0) {
    const ids = isOwner ? accepted.map((a) => a.applicant_id) : [job.employer_id];
    const res = await supabase.from("private_contacts").select("user_id, phone").in("user_id", ids);
    for (const row of res.data ?? []) phones.set(row.user_id, row.phone);
  }

  const active = job.status === "open" || job.status === "assigned";
  const canApply =
    profile &&
    !isOwner &&
    !mine &&
    job.status === "open" &&
    (profile.role === "worker" || (profile.role === "volunteer" && job.is_volunteer));
  const shown = isOwner ? applications.filter((a) => a.status !== "withdrawn") : [];

  return (
    <article className="space-y-4">
      <Flash params={await searchParams} />
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-semibold">{job.title}</h1>
          <span className={`badge ${job.is_volunteer ? "bg-amber-100 text-amber-900" : "bg-teal-100 text-teal-900"}`}>
            {formatBudget(job)}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {job.category} · {job.city} · posted {formatDate(job.created_at)} ·{" "}
          <span className="font-medium">{job.status}</span>
        </p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{job.description}</p>

        {isOwner && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            {active && accepted.length > 0 && (
              <form action={setJobStatus}>
                <input type="hidden" name="job_id" value={job.id} />
                <input type="hidden" name="status" value="done" />
                <button className="btn" type="submit">Mark as done</button>
              </form>
            )}
            {active && (
              <form action={setJobStatus}>
                <input type="hidden" name="job_id" value={job.id} />
                <input type="hidden" name="status" value="cancelled" />
                <button className="btn-ghost" type="submit">
                  {accepted.length > 0 ? "Cancel job (lowers your score)" : "Cancel job"}
                </button>
              </form>
            )}
            {job.status === "cancelled" && accepted.length === 0 && (
              <form action={setJobStatus}>
                <input type="hidden" name="job_id" value={job.id} />
                <input type="hidden" name="status" value="open" />
                <button className="btn-ghost" type="submit">Reopen</button>
              </form>
            )}
            {(job.status === "open" || job.status === "cancelled") && accepted.length === 0 && (
              <details className="ml-auto">
                <summary className="btn-danger cursor-pointer list-none">Delete</summary>
                <form action={deleteJob} className="mt-2 text-sm">
                  <input type="hidden" name="job_id" value={job.id} />
                  <p className="mb-2 text-slate-600">This removes the job and its requests for good.</p>
                  <button className="btn-danger" type="submit">Yes, delete this job</button>
                </form>
              </details>
            )}
          </div>
        )}
      </div>

      {!isOwner && employer && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-600">Posted by</h2>
          <UserCard user={employer}>
            {mine?.status === "accepted" ? (
              <p>
                Phone: <span className="font-medium">{phones.get(job.employer_id) || "not added yet"}</span>
              </p>
            ) : null}
            {mine?.status === "accepted" && job.status === "done" && (
              <div className="mt-4">
                {reviewed.has(job.employer_id) ? (
                  <p className="text-slate-600">You reviewed this employer. Thank you.</p>
                ) : (
                  <ReviewForm jobId={job.id} revieweeId={job.employer_id} name={employer.full_name || "this employer"} />
                )}
              </div>
            )}
          </UserCard>
        </section>
      )}

      {!userId && job.status === "open" && (
        <p className="card text-sm">
          <Link href="/login" className="text-brand underline">Log in</Link> or{" "}
          <Link href="/signup" className="text-brand underline">sign up</Link> as a worker
          {job.is_volunteer ? " or volunteer" : ""} to take this job.
        </p>
      )}

      {profile?.role === "volunteer" && !job.is_volunteer && !isOwner && (
        <p className="card text-sm text-slate-600">
          This is a paid job. Volunteer accounts can join volunteer jobs only.
        </p>
      )}

      {canApply && (
        <form action={applyToJob} className="card space-y-3">
          <input type="hidden" name="job_id" value={job.id} />
          <div>
            <label className="label" htmlFor="message">
              {job.is_volunteer ? "Message to the organiser (optional)" : "Message to the employer (optional)"}
            </label>
            <textarea className="input" id="message" name="message" rows={3} maxLength={1000} placeholder="When you are free, your experience, your price" />
          </div>
          <button className="btn" type="submit">{job.is_volunteer ? "Join this job" : "Apply"}</button>
        </form>
      )}

      {mine && !isOwner && (
        <div className="card text-sm">
          <p>
            Your request: <span className="font-medium">{STATUS_LABEL[mine.status]}</span>
          </p>
          {(mine.status === "pending" || (mine.status === "accepted" && active)) && (
            <form action={withdrawApplication} className="mt-3">
              <input type="hidden" name="application_id" value={mine.id} />
              <input type="hidden" name="job_id" value={job.id} />
              <button className="btn-ghost" type="submit">
                {mine.status === "accepted" ? "Back out (lowers your score)" : "Withdraw request"}
              </button>
            </form>
          )}
        </div>
      )}

      {isOwner && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Requests ({shown.length})</h2>
          {shown.length === 0 ? (
            <p className="card text-sm text-slate-600">Nobody has applied yet.</p>
          ) : (
            <ul className="space-y-3">
              {shown.map((a) =>
                a.applicant ? (
                  <li key={a.id}>
                    <UserCard user={a.applicant}>
                      <p className="mb-2">
                        <span className="badge">{STATUS_LABEL[a.status]}</span>
                        {a.applicant.skills?.length > 0 && (
                          <span className="ml-2 text-slate-600">{a.applicant.skills.join(", ")}</span>
                        )}
                      </p>
                      {a.message && <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3">{a.message}</p>}
                      {a.status === "accepted" && (
                        <p className="mt-2">
                          Phone: <span className="font-medium">{phones.get(a.applicant_id) || "not added yet"}</span>
                        </p>
                      )}
                      {a.status === "pending" && job.status === "open" && (
                        <form action={decideApplication} className="mt-3 flex gap-2">
                          <input type="hidden" name="application_id" value={a.id} />
                          <input type="hidden" name="job_id" value={job.id} />
                          <button className="btn" name="decision" value="accept" type="submit">Accept</button>
                          <button className="btn-ghost" name="decision" value="reject" type="submit">Decline</button>
                        </form>
                      )}
                      {a.status === "accepted" && job.status === "done" && (
                        <div className="mt-4">
                          {reviewed.has(a.applicant_id) ? (
                            <p className="text-slate-600">You reviewed {a.applicant.full_name || "them"}. Thank you.</p>
                          ) : (
                            <ReviewForm jobId={job.id} revieweeId={a.applicant_id} name={a.applicant.full_name || "them"} />
                          )}
                        </div>
                      )}
                    </UserCard>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </section>
      )}
    </article>
  );
}
