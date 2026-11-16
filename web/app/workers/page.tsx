import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { getCategories } from "@/lib/categories";
import { UserCard } from "@/components/user-card";
import { STATS_COLUMNS, type CardUser, type Stats } from "@/lib/site";
import type { PageParams } from "@/components/flash";

export const metadata = { title: "Find workers" };

const PAGE_SIZE = 30;

type Row = Stats & { user: Omit<CardUser, "stats"> & { bio: string; skills: string[] } };

// Employers browse workers and volunteers here, best score first.
export default async function WorkersPage({ searchParams }: { searchParams: PageParams }) {
  const { supabase, profile } = await requireViewer();
  if (profile.role !== "employer") redirect("/");

  const params = await searchParams;
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string).trim() : "");
  const skill = one("skill");
  const city = one("city");
  const who = one("who") || "all";
  const categories = await getCategories();

  // Read from user_stats so the list can be sorted by score in the database.
  let query = supabase
    .from("user_stats")
    .select(`${STATS_COLUMNS}, user:profiles!inner(id, full_name, role, city, created_at, bio, skills)`)
    .in("user.role", who === "worker" ? ["worker"] : who === "volunteer" ? ["volunteer"] : ["worker", "volunteer"])
    .order("score", { ascending: false })
    .limit(PAGE_SIZE);
  if (skill) query = query.contains("user.skills", [skill]);
  if (city) query = query.ilike("user.city", `%${city.replace(/[%_\\]/g, "\\$&")}%`);
  const { data, error } = await query;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Find workers</h1>
      <p className="mb-6 text-sm text-slate-600">
        Sorted by score. Phone numbers appear once you accept someone on one of your jobs.
      </p>
      <form className="mb-6 grid gap-3 sm:grid-cols-4" method="get">
        <div>
          <label className="label" htmlFor="skill">Skill</label>
          <select className="input" id="skill" name="skill" defaultValue={skill}>
            <option value="">Any</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="city">City</label>
          <input className="input" id="city" name="city" defaultValue={city} />
        </div>
        <div>
          <label className="label" htmlFor="who">Show</label>
          <select className="input" id="who" name="who" defaultValue={who}>
            <option value="all">Workers and volunteers</option>
            <option value="worker">Workers only</option>
            <option value="volunteer">Volunteers only</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn w-full" type="submit">Search</button>
        </div>
      </form>

      {error ? (
        <p className="card text-sm text-red-700" role="alert">Workers could not be loaded. Refresh to try again.</p>
      ) : rows.length === 0 ? (
        <p className="card text-sm text-slate-600">Nobody matches. Try a wider search.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ user, ...stats }) => (
            <li key={user.id}>
              <UserCard user={{ ...user, stats }}>
                {user.bio && <p className="whitespace-pre-wrap">{user.bio}</p>}
                {user.skills.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1">
                    {user.skills.map((k) => <span key={k} className="badge">{k}</span>)}
                  </p>
                )}
              </UserCard>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
