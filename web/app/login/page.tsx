import Link from "next/link";
import { signIn } from "@/app/auth/actions";
import { Flash, type PageParams } from "@/components/flash";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: PageParams }) {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Log in</h1>
      <Flash params={await searchParams} />
      <form action={signIn} className="card space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <button className="btn w-full" type="submit">Log in</button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        <Link className="text-brand underline" href="/forgot-password">Forgot your password?</Link>
        {" · "}
        <Link className="text-brand underline" href="/resend-confirmation">Resend confirmation email</Link>
      </p>
      <p className="mt-2 text-sm text-slate-600">
        No account yet? <Link className="text-brand underline" href="/signup">Sign up</Link>
      </p>
    </div>
  );
}
