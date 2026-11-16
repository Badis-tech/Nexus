import Link from "next/link";
import { signUp } from "@/app/auth/actions";
import { Flash, type PageParams } from "@/components/flash";
import { ROLES } from "@/lib/site";

export const metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: { searchParams: PageParams }) {
  const params = await searchParams;
  const preset = typeof params.role === "string" ? params.role : "";
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Create your account</h1>
      <Flash params={params} />
      <form action={signUp} className="card space-y-4">
        <fieldset>
          <legend className="label">I am joining as</legend>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-300 p-3 has-checked:border-brand has-checked:bg-teal-50"
              >
                <input type="radio" name="role" value={r.value} required defaultChecked={preset === r.value} className="mt-1" />
                <span>
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="block text-sm text-slate-600">{r.blurb}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">The account type cannot be changed later.</p>
        </fieldset>
        <div>
          <label className="label" htmlFor="full_name">Name</label>
          <input className="input" id="full_name" name="full_name" autoComplete="name" maxLength={80} required />
        </div>
        <div>
          <label className="label" htmlFor="city">City</label>
          <input className="input" id="city" name="city" autoComplete="address-level2" maxLength={80} />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>
        <button className="btn w-full" type="submit">Create account</button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already have an account? <Link className="text-brand underline" href="/login">Log in</Link>
      </p>
    </div>
  );
}
