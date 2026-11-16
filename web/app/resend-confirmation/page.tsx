import Link from "next/link";
import { resendConfirmation } from "@/app/auth/actions";
import { Flash, type PageParams } from "@/components/flash";

export const metadata = { title: "Confirm your email" };

export default async function ResendConfirmationPage({ searchParams }: { searchParams: PageParams }) {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-semibold">Confirm your email</h1>
      <p className="mb-6 text-sm text-slate-600">
        New accounts need to open the link we email them. Enter your address to get a new link.
      </p>
      <Flash params={await searchParams} />
      <form action={resendConfirmation} className="card space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <button className="btn w-full" type="submit">Send confirmation email again</button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        Already confirmed? <Link className="text-brand underline" href="/login">Log in</Link>
      </p>
    </div>
  );
}
