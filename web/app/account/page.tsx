import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { Flash, type PageParams } from "@/components/flash";
import { signOut } from "@/app/auth/actions";
import { changeEmail, changePassword, changePlan, deleteAccount, updateProfile } from "@/app/account/actions";
import { formatDate } from "@/lib/site";
import { getCategories } from "@/lib/categories";
import { PLANS, priceLabel } from "@/lib/plans";

export const metadata = { title: "Account" };

export default async function AccountPage({ searchParams }: { searchParams: PageParams }) {
  const { supabase, userId, email, profile } = await requireViewer();
  const [categories, { data: contact }, { data: payments }] = await Promise.all([
    getCategories(),
    supabase.from("private_contacts").select("phone").eq("user_id", userId).maybeSingle(),
    supabase.from("payments").select("id, plan, amount, currency, status, created_at").order("created_at", { ascending: false }).limit(20),
  ]);
  const plan = PLANS[profile.role].find((p) => p.id === profile.plan)!;
  const hasPro = PLANS[profile.role].some((p) => p.id === "pro");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Account</h1>
        <form action={signOut}>
          <button className="btn-ghost" type="submit">Log out</button>
        </form>
      </div>
      <Flash params={await searchParams} />

      <section className="card">
        <h2 className="mb-1 text-lg font-semibold">Profile</h2>
        <p className="mb-4 text-sm text-slate-600">
          {email} · {profile.role} account ·{" "}
          <Link href={`/users/${userId}`} className="text-brand underline">See your public card and score</Link>
        </p>
        <form action={updateProfile} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="full_name">Name</label>
              <input className="input" id="full_name" name="full_name" maxLength={80} required defaultValue={profile.full_name} />
            </div>
            <div>
              <label className="label" htmlFor="city">City</label>
              <input className="input" id="city" name="city" maxLength={80} defaultValue={profile.city} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input className="input" id="phone" name="phone" type="tel" maxLength={30} autoComplete="tel" defaultValue={contact?.phone ?? ""} />
            <p className="mt-1 text-xs text-slate-500">
              Only shown to the other person once a request is accepted.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="bio">About you</label>
            <textarea className="input" id="bio" name="bio" rows={3} maxLength={1000} defaultValue={profile.bio} />
          </div>
          {profile.role !== "employer" && (
            <fieldset>
              <legend className="label">What you can do</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categories.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="skills" value={c} defaultChecked={profile.skills.includes(c)} />
                    {c}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <button className="btn" type="submit">Save profile</button>
        </form>
      </section>

      <section className="card" id="plan">
        <h2 className="mb-1 text-lg font-semibold">Plan</h2>
        <p className="text-sm">
          <span className="font-medium">{plan.name}</span> · {priceLabel(plan)}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {plan.features.map((f) => <li key={f}>{f}</li>)}
        </ul>
        {hasPro && (
          <div className="mt-4">
            {profile.plan === "free" ? (
              <Link href="/checkout" className="btn">Upgrade to Pro</Link>
            ) : (
              <form action={changePlan}>
                <input type="hidden" name="plan" value="free" />
                <button className="btn-ghost" type="submit">Switch back to Free</button>
              </form>
            )}
          </div>
        )}
        {payments && payments.length > 0 && (
          <>
            <h3 className="mt-5 mb-2 text-sm font-semibold">Payments</h3>
            <ul className="divide-y divide-slate-200 text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between py-2">
                  <span>{formatDate(p.created_at)} · {p.plan}</span>
                  <span>
                    {p.amount} {p.currency} <span className="badge ml-1">{p.status}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Email</h2>
        <form action={changeEmail} className="flex flex-wrap items-end gap-3">
          <div className="grow">
            <label className="label" htmlFor="email">New email address</label>
            <input className="input" id="email" name="email" type="email" autoComplete="email" required placeholder={email ?? ""} />
          </div>
          <button className="btn-ghost" type="submit">Change email</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">It only changes after you confirm from the new inbox.</p>
      </section>

      <section className="card">
        <h2 className="mb-3 text-lg font-semibold">Password</h2>
        <form action={changePassword} className="space-y-3">
          <div>
            <label className="label" htmlFor="current">Current password</label>
            <input className="input" id="current" name="current" type="password" autoComplete="current-password" required />
          </div>
          <div>
            <label className="label" htmlFor="password">New password</label>
            <input className="input" id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
          </div>
          <button className="btn-ghost" type="submit">Change password</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Forgot the current one? Log out and use <Link href="/forgot-password" className="text-brand underline">Forgot your password</Link>.
        </p>
      </section>

      <section className="card border-red-200">
        <h2 className="mb-1 text-lg font-semibold">Delete account</h2>
        <p className="mb-3 text-sm text-slate-600">
          This permanently removes your profile, jobs, requests and payment history. It cannot be undone.
        </p>
        <form action={deleteAccount} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="confirm">Type DELETE to confirm</label>
            <input className="input" id="confirm" name="confirm" autoComplete="off" required />
          </div>
          <button className="btn-danger" type="submit">Delete my account</button>
        </form>
      </section>
    </div>
  );
}
