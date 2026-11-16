import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { Flash, type PageParams } from "@/components/flash";
import { PLANS, priceLabel } from "@/lib/plans";
import { ROLES, type Role } from "@/lib/site";

export const metadata = { title: "Plans" };

export default async function PricingPage({ searchParams }: { searchParams: PageParams }) {
  const { profile } = await getViewer();
  // Signed in: only the plans for your account type. Signed out: all of them.
  const roles: Role[] = profile ? [profile.role] : ["employer", "worker", "volunteer"];

  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">Plans</h1>
      <p className="mb-6 text-sm text-slate-600">
        Payments are in test mode: choosing Pro switches your plan without charging you.
      </p>
      <Flash params={await searchParams} />
      <div className="space-y-8">
        {roles.map((role) => (
          <section key={role}>
            <h2 className="mb-3 text-lg font-semibold">
              For {ROLES.find((r) => r.value === role)!.label.toLowerCase()}s
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {PLANS[role].map((plan) => {
                const current = profile?.plan === plan.id;
                return (
                  <div key={plan.id} className={`card ${current ? "border-brand" : ""}`}>
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-base font-semibold">{plan.name}</h3>
                      <p className="text-sm font-medium">{priceLabel(plan)}</p>
                    </div>
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {plan.features.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                    <div className="mt-4">
                      {!profile ? (
                        <Link href={`/signup?role=${role}`} className="btn-ghost">Sign up</Link>
                      ) : current ? (
                        <span className="badge bg-teal-100 text-teal-900">Your plan</span>
                      ) : plan.id === "pro" ? (
                        <Link href="/checkout" className="btn">Upgrade to Pro</Link>
                      ) : (
                        <Link href="/account#plan" className="btn-ghost">Manage in account</Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
