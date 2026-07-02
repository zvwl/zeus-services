import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, LayoutDashboard, Package, Settings } from "lucide-react";
import { getProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

const tabs = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/settings", label: "Settings", icon: Settings },
  { href: "/account/security", label: "Security", icon: KeyRound },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/account");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold text-white">My account</h1>
      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-edge pb-px">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-raised hover:text-white"
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </Link>
        ))}
      </div>
      <div className="py-8">{children}</div>
    </div>
  );
}
