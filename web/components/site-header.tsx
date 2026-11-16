import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { SITE_NAME } from "@/lib/site";

export async function SiteHeader() {
  const { profile } = await getViewer();
  const link = "rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-100";
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3" aria-label="Main">
        <Link href="/" className="mr-auto text-base font-semibold text-brand">
          {SITE_NAME}
        </Link>
        <Link href="/" className={link}>Jobs</Link>
        <Link href="/pricing" className={link}>Plans</Link>
        {profile ? (
          <>
            <Link href="/dashboard" className={link}>Dashboard</Link>
            <Link href="/account" className={link}>Account</Link>
            {profile.role === "employer" && (
              <Link href="/jobs/new" className="btn ml-1">Post a job</Link>
            )}
          </>
        ) : (
          <>
            <Link href="/login" className={link}>Log in</Link>
            <Link href="/signup" className="btn ml-1">Sign up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
