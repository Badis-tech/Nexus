import { notFound } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { CARD_COLUMNS, formatDate, type CardUser } from "@/lib/site";
import { Stars, UserCard } from "@/components/user-card";

interface FullStats {
  jobs_posted: number;
  jobs_completed: number;
  jobs_cancelled_late: number;
  applications_sent: number;
  applications_accepted: number;
  jobs_dropped: number;
  avg_response_hours: number | null;
  profile_pct: number;
  score_rating: number;
  score_reliability: number;
  score_responsiveness: number;
  score_profile: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: { full_name: string } | null;
}

function Bar({ label, value, weight, hint }: { label: string; value: number; weight: number; hint: string }) {
  const v = Math.round(Number(value));
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>
          {label} <span className="text-slate-500">({weight}% of score)</span>
        </span>
        <span className="font-medium">{v}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-100" role="img" aria-label={`${label}: ${v} out of 100`}>
        <div className="h-2 rounded-full bg-brand" style={{ width: `${v}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, userId } = await getViewer();

  const [{ data: user }, { data: extra }, { data: stats }, { data: reviewRows }] = await Promise.all([
    supabase.from("profiles").select(CARD_COLUMNS).eq("id", id).maybeSingle(),
    supabase.from("profiles").select("bio, skills").eq("id", id).maybeSingle(),
    supabase.from("user_stats").select("*").eq("user_id", id).maybeSingle(),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(full_name)")
      .eq("reviewee_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  if (!user) notFound();
  const card = user as unknown as CardUser;
  const s = stats as FullStats | null;
  const reviews = (reviewRows ?? []) as unknown as Review[];
  const isEmployer = card.role === "employer";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <UserCard user={card}>
        {extra?.bio ? <p className="whitespace-pre-wrap">{extra.bio}</p> : <p className="text-slate-500">No description yet.</p>}
        {extra?.skills?.length > 0 && (
          <p className="mt-3 flex flex-wrap gap-1">
            {(extra!.skills as string[]).map((k) => <span key={k} className="badge">{k}</span>)}
          </p>
        )}
      </UserCard>

      {s && (
        <>
          <section className="card">
            <h2 className="mb-3 text-lg font-semibold">Activity</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-slate-500">Jobs done</dt><dd className="text-xl font-semibold">{s.jobs_completed}</dd></div>
              {isEmployer ? (
                <>
                  <div><dt className="text-slate-500">Jobs posted</dt><dd className="text-xl font-semibold">{s.jobs_posted}</dd></div>
                  <div><dt className="text-slate-500">Cancelled after accepting</dt><dd className="text-xl font-semibold">{s.jobs_cancelled_late}</dd></div>
                  <div>
                    <dt className="text-slate-500">Answers requests in</dt>
                    <dd className="text-xl font-semibold">
                      {s.avg_response_hours == null ? "No data" : Number(s.avg_response_hours) < 1 ? "Under 1 h" : `${Math.round(Number(s.avg_response_hours))} h`}
                    </dd>
                  </div>
                </>
              ) : (
                <>
                  <div><dt className="text-slate-500">Requests sent</dt><dd className="text-xl font-semibold">{s.applications_sent}</dd></div>
                  <div><dt className="text-slate-500">Backed out after accepted</dt><dd className="text-xl font-semibold">{s.jobs_dropped}</dd></div>
                </>
              )}
            </dl>
          </section>

          <section className="card space-y-4">
            <h2 className="text-lg font-semibold">How the score is built</h2>
            <Bar label="Reviews" weight={55} value={s.score_rating} hint="Star ratings from finished jobs. New accounts start from a neutral 4 stars until reviews come in." />
            <Bar label="Reliability" weight={25} value={s.score_reliability} hint="Finished jobs against late cancellations and drop-outs." />
            <Bar label="Responsiveness" weight={10} value={s.score_responsiveness} hint="How fast requests get an answer. Neutral when there is nothing to answer yet." />
            <Bar label="Profile" weight={10} value={s.score_profile} hint={userId === id ? "Fill in your name, city, phone, description and skills to reach 100." : "How complete the profile is."} />
          </section>
        </>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="card text-sm text-slate-600">No reviews yet. They appear after a finished job.</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="card text-sm">
                <p>
                  <Stars value={r.rating} />{" "}
                  <span className="text-slate-600">
                    {r.reviewer?.full_name || "Former member"} · {formatDate(r.created_at)}
                  </span>
                </p>
                {r.comment && <p className="mt-2 whitespace-pre-wrap">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
