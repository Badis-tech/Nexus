import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";
import { Flash, type PageParams } from "@/components/flash";

export const metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: PageParams }) {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-semibold">Forgot your password?</h1>
      <p className="mb-6 text-sm text-slate-600">Enter your email and we will send you a link to set a new one.</p>
      <Flash params={await searchParams} />
      <form action={requestPasswordReset} className="card space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <button className="btn w-full" type="submit">Send reset link</button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        <Link className="text-brand underline" href="/login">Back to log in</Link>
      </p>
    </div>
  );
}
