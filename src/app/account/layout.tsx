import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { Reveal } from "@/components/motion";
import { AccountNav } from "./AccountNav";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/account");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <Reveal y={14}>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-light">
          Account
        </p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          My account
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Welcome back
          {profile.username ? (
            <>
              , <span className="font-semibold text-zinc-200">{profile.username}</span>
            </>
          ) : null}
          {" — "}manage your orders, security and preferences.
        </p>
      </Reveal>

      <div className="mt-8 flex flex-col gap-8 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div className="lg:sticky lg:top-24">
          <AccountNav />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
