import Link from "next/link";
import { requireViewer, monthStart } from "@/lib/auth";
import { createJob } from "@/app/jobs/actions";
import { Flash, type PageParams } from "@/components/flash";
import { CURRENCY } from "@/lib/site";
import { getCategories } from "@/lib/categories";
import { MONTHLY_LIMIT } from "@/lib/plans";

export const metadata = { title: "Post a job" };

export default async function NewJobPage({ searchParams }: { searchParams: PageParams }) {
  const { supabase, userId, profile } = await requireViewer();
  if (profile.role !== "employer") {
    return <p className="card text-sm">Only employer accounts can post jobs.</p>;
  }
  const categories = await getCategories();
  const limit = MONTHLY_LIMIT.employer!;
  const { count } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("employer_id", userId)
    .gte("created_at", monthStart());
  const used = count ?? 0;
  const blocked = profile.plan === "free" && used >= limit;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-2xl font-semibold">Post a job</h1>
      {profile.plan === "free" && (
        <p className="mb-6 text-sm text-slate-600">
          {used} of {limit} free posts used this month.{" "}
          <Link href="/pricing" className="text-brand underline">Get unlimited posts</Link>
        </p>
      )}
      <Flash params={await searchParams} />
      {blocked ? (
        <div className="card text-sm">
          <p>You have used all {limit} free posts for this month.</p>
          <Link href="/pricing" className="btn mt-3">See plans</Link>
        </div>
      ) : (
        <form action={createJob} className="card space-y-4">
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input className="input" id="title" name="title" minLength={3} maxLength={120} required placeholder="Fix a leaking kitchen tap" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="category">Category</label>
              <select className="input" id="category" name="category" required defaultValue="">
                <option value="" disabled>Choose one</option>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="city">City</label>
              <input className="input" id="city" name="city" maxLength={80} required defaultValue={profile.city} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="description">What needs doing</label>
            <textarea className="input" id="description" name="description" rows={5} maxLength={4000} required />
          </div>
          <div>
            <label className="label" htmlFor="budget">Budget in {CURRENCY} (optional)</label>
            <input className="input" id="budget" name="budget" type="number" min={0} step="0.01" inputMode="decimal" />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="is_volunteer" className="mt-1" />
            <span>
              This is an unpaid community job (for example a street clean-up). Volunteers can join it and
              the budget is ignored.
            </span>
          </label>
          <button className="btn" type="submit">Post job</button>
        </form>
      )}
    </div>
  );
}
