import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { JOB_COLUMNS, type Job } from "@/lib/site";
import { getCategories } from "@/lib/categories";
import { JobCard } from "@/components/job-card";
import { Flash, type PageParams } from "@/components/flash";

const PAGE_SIZE = 20;

export default async function HomePage({ searchParams }: { searchParams: PageParams }) {
  const params = await searchParams;
  const { supabase, profile } = await getViewer();
  const categories = await getCategories();
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string).trim() : "");
  const q = one("q");
  const category = one("category");
  const city = one("city");
  const before = one("before");
  // Volunteers start on volunteer jobs: those are the ones they can join.
  const kind = one("kind") || (profile?.role === "volunteer" ? "volunteer" : "all");

  // Keyset pagination: "older than the last job you saw" stays fast at any
  // depth, unlike page numbers with OFFSET.
  let query = supabase
    .from("jobs")
    .select(JOB_COLUMNS)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1);
  if (q) query = query.textSearch("search", q, { type: "websearch", config: "simple" });
  if (category) query = query.eq("category", category);
  if (city) query = query.ilike("city", `%${city.replace(/[%_\\]/g, "\\$&")}%`);
  if (kind === "volunteer") query = query.eq("is_volunteer", true);
  if (kind === "paid") query = query.eq("is_volunteer", false);
  if (before && !Number.isNaN(Date.parse(before))) query = query.lt("created_at", before);
  const { data, error } = await query;
  const rows = (data ?? []) as unknown as Job[];
  const jobs = rows.slice(0, PAGE_SIZE);
  const hasMore = rows.length > PAGE_SIZE;

  const olderHref = () => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (category) sp.set("category", category);
    if (city) sp.set("city", city);
    if (one("kind")) sp.set("kind", kind);
    sp.set("before", jobs[jobs.length - 1].created_at);
    return `/?${sp.toString()}`;
  };

  return (
    <>
      <Flash params={params} />
      {!profile && (
        <section className="mb-8 rounded-xl bg-brand px-6 py-8 text-white">
          <h1 className="text-2xl font-semibold">Get a job done, or find one near you</h1>
          <p className="mt-2 max-w-xl text-sm text-teal-50">
            Plumbing, painting, gardening, cleaning and community work. Post what you need, offer your
            skills, or volunteer.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/signup?role=employer" className="btn-ghost">I need a job done</Link>
            <Link href="/signup?role=worker" className="btn-ghost">I offer a service</Link>
            <Link href="/signup?role=volunteer" className="btn-ghost">I want to volunteer</Link>
          </div>
        </section>
      )}

      <h2 className="mb-4 text-xl font-semibold">Open jobs</h2>
      <form className="mb-6 grid gap-3 sm:grid-cols-5" method="get">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="q">Search</label>
          <input className="input" id="q" name="q" defaultValue={q} placeholder="leaking tap, garden, paint" />
        </div>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select className="input" id="category" name="category" defaultValue={category}>
            <option value="">All</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="city">City</label>
          <input className="input" id="city" name="city" defaultValue={city} />
        </div>
        <div>
          <label className="label" htmlFor="kind">Type</label>
          <select className="input" id="kind" name="kind" defaultValue={kind}>
            <option value="all">Paid and volunteer</option>
            <option value="paid">Paid only</option>
            <option value="volunteer">Volunteer only</option>
          </select>
        </div>
        <div className="sm:col-span-5">
          <button className="btn" type="submit">Search</button>
        </div>
      </form>

      {error ? (
        <p className="card text-sm text-red-700" role="alert">Jobs could not be loaded. Refresh to try again.</p>
      ) : jobs.length === 0 ? (
        <p className="card text-sm text-slate-600">
          No open jobs match.{" "}
          {profile?.role === "employer" ? (
            <Link href="/jobs/new" className="text-brand underline">Post one</Link>
          ) : (
            "Try a wider search."
          )}
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </ul>
          <div className="mt-6 flex gap-2">
            {before && <Link href="/" className="btn-ghost">Back to newest</Link>}
            {hasMore && <Link href={olderHref()} className="btn-ghost">Older jobs</Link>}
          </div>
        </>
      )}
    </>
  );
}
