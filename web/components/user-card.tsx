import Link from "next/link";
import { formatDate, tier, type CardUser } from "@/lib/site";

export function scoreTone(score: number) {
  if (score >= 85) return "bg-teal-600";
  if (score >= 70) return "bg-teal-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span aria-label={`${value} out of 5 stars`} className="text-amber-500">
      {"★".repeat(full)}
      <span className="text-slate-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}

// The card shown wherever one user needs to judge another.
export function UserCard({ user, children }: { user: CardUser; children?: React.ReactNode }) {
  const stats = user.stats;
  const score = stats ? Math.round(Number(stats.score)) : null;
  const initials =
    user.full_name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
  return (
    <div className="card">
      <div className="flex items-center gap-4">
        <div aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
          {initials}
        </div>
        <div className="min-w-0 grow">
          <p className="truncate font-semibold">
            <Link href={`/users/${user.id}`} className="hover:text-brand hover:underline">
              {user.full_name || "Unnamed"}
            </Link>
          </p>
          <p className="text-sm text-slate-600">
            <span className="capitalize">{user.role}</span>
            {user.city && <> · {user.city}</>} · joined {formatDate(user.created_at)}
          </p>
          {stats && (
            <p className="mt-1 text-sm text-slate-700">
              {stats.rating_count > 0 && stats.rating_avg != null ? (
                <>
                  <Stars value={Number(stats.rating_avg)} /> {Number(stats.rating_avg).toFixed(1)} ({stats.rating_count})
                </>
              ) : (
                "No reviews yet"
              )}{" "}
              · {stats.jobs_completed} job{stats.jobs_completed === 1 ? "" : "s"} done ·{" "}
              <span className="badge">{tier(stats.jobs_completed)}</span>
            </p>
          )}
        </div>
        {score != null && (
          <div className="shrink-0 text-center">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white ${scoreTone(score)}`}>
              {score}
            </div>
            <p className="mt-1 text-xs text-slate-500">score</p>
          </div>
        )}
      </div>
      {children && <div className="mt-4 border-t border-slate-200 pt-4 text-sm">{children}</div>}
    </div>
  );
}
