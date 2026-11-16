import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { resetPassword } from "@/app/auth/actions";
import { Flash, type PageParams } from "@/components/flash";

export const metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: PageParams }) {
  const { userId } = await getViewer();
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Set a new password</h1>
      <Flash params={await searchParams} />
      {!userId ? (
        <p className="card text-sm">
          This page opens from the link in the reset email.{" "}
          <Link className="text-brand underline" href="/forgot-password">Request a new link</Link>
        </p>
      ) : (
        <form action={resetPassword} className="card space-y-4">
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input className="input" id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
            <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
          </div>
          <div>
            <label className="label" htmlFor="confirm">Repeat it</label>
            <input className="input" id="confirm" name="confirm" type="password" minLength={8} autoComplete="new-password" required />
          </div>
          <button className="btn w-full" type="submit">Save password</button>
        </form>
      )}
    </div>
  );
}
