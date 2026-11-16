import Link from "next/link";
import { formatBudget, formatDate, type Job } from "@/lib/site";

export function JobCard({ job, extra }: { job: Job; extra?: React.ReactNode }) {
  return (
    <li className="card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold">
          <Link href={`/jobs/${job.id}`} className="hover:text-brand hover:underline">
            {job.title}
          </Link>
        </h3>
        <span className={`badge ${job.is_volunteer ? "bg-amber-100 text-amber-900" : "bg-teal-100 text-teal-900"}`}>
          {formatBudget(job)}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {job.category} · {job.city} · {formatDate(job.created_at)}
        {job.status !== "open" && <> · <span className="font-medium">{job.status}</span></>}
      </p>
      {extra && <div className="mt-3">{extra}</div>}
    </li>
  );
}
