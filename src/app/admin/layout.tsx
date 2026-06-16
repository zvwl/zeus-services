import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Coffee,
  FolderTree,
  Gamepad2,
  Gift,
  LayoutDashboard,
  LayoutPanelTop,
  LifeBuoy,
  MessageSquareQuote,
  Newspaper,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { getProfile, isStaff, roleAtLeast } from "@/lib/auth";
import type { Role } from "@/lib/types";

// minRole = lowest role allowed to see/use each section. Mirrors the server
// action guards: support handles orders/customers/support; admins manage the
// rest; super admins also get Team.
const nav: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  minRole: Role;
}[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, minRole: "support" },
  { href: "/admin/orders", label: "Orders", icon: Package, minRole: "support" },
  { href: "/admin/customers", label: "Customers", icon: Users, minRole: "support" },
  { href: "/admin/support", label: "Support", icon: LifeBuoy, minRole: "support" },
  { href: "/admin/products", label: "Products", icon: ShoppingBag, minRole: "admin" },
  { href: "/admin/games", label: "Games", icon: Gamepad2, minRole: "admin" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, minRole: "admin" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, minRole: "admin" },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, minRole: "admin" },
  { href: "/admin/giveaways", label: "Giveaways", icon: Gift, minRole: "admin" },
  { href: "/admin/faqs", label: "FAQs", icon: MessageSquareQuote, minRole: "admin" },
  { href: "/admin/donations", label: "Donations", icon: Coffee, minRole: "admin" },
  { href: "/admin/sections", label: "Layout", icon: LayoutPanelTop, minRole: "admin" },
  { href: "/admin/settings", label: "Settings", icon: Settings, minRole: "admin" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile || !isStaff(profile)) redirect("/");

  const visibleNav = nav.filter((item) => roleAtLeast(profile, item.minRole));

  return (
    <div className="mx-auto flex max-w-[1600px]">
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col overflow-y-auto border-r border-edge bg-surface/40 p-4 lg:flex">
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2.5">
          <Zap className="h-4 w-4 text-primary-light" fill="currentColor" />
          <div>
            <p className="text-sm font-bold text-white">Admin panel</p>
            <p className="text-[11px] capitalize text-zinc-500">
              {profile.role.replace("_", " ")} · {profile.username}
            </p>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-raised hover:text-white"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {profile.role === "super_admin" && (
            <Link
              href="/admin/team"
              className="mt-2 flex items-center gap-2.5 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-sm text-amber-300 transition hover:bg-amber-400/10"
            >
              <ShieldCheck className="h-4 w-4" />
              Team & roles
            </Link>
          )}
        </nav>
        <Link
          href="/"
          className="mt-auto rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-primary-light"
        >
          ← Back to store
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b border-edge p-2 lg:hidden">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-raised hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          {profile.role === "super_admin" && (
            <Link
              href="/admin/team"
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-amber-300"
            >
              Team
            </Link>
          )}
        </div>
        <div className="p-4 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
