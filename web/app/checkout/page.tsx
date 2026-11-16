import Link from "next/link";
import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/auth";
import { changePlan } from "@/app/account/actions";
import { PLANS, priceLabel } from "@/lib/plans";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const { profile } = await requireViewer();
  const pro = PLANS[profile.role].find((p) => p.id === "pro");
  if (!pro || profile.plan === "pro") redirect("/account");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Upgrade to Pro</h1>
      <div className="card">
        <div className="flex items-baseline justify-between">
          <p className="font-medium">{pro.name} for {profile.role}s</p>
          <p className="text-sm font-medium">{priceLabel(pro)}</p>
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {pro.features.map((f) => <li key={f}>{f}</li>)}
        </ul>
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Test mode. No card is needed and you will not be charged.
        </p>
        <form action={changePlan} className="mt-4 flex gap-2">
          <input type="hidden" name="plan" value="pro" />
          <button className="btn" type="submit">Confirm test payment</button>
          <Link href="/pricing" className="btn-ghost">Back</Link>
        </form>
      </div>
    </div>
  );
}
