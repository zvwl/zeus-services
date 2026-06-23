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
import { can, getProfile, isStaff } from "@/lib/auth";
import type { Capability } from "@/lib/types";

// Each section is shown only to staff who hold its capability (from their role
// default or a per-staff override). The dashboard needs none. Mirrors the
// server-action and middleware capability guards.
const nav: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  capability: Capability | null;
}[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, capability: null },
  { href: "/admin/orders", label: "Orders", icon: Package, capability: "manage_orders" },
  { href: "/admin/customers", label: "Customers", icon: Users, capability: "manage_customers" },
  { href: "/admin/support", label: "Support", icon: LifeBuoy, capability: "manage_support" },
  { href: "/admin/products", label: "Products", icon: ShoppingBag, capability: "manage_products" },
  { href: "/admin/games", label: "Games", icon: Gamepad2, capability: "manage_games" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, capability: "manage_categories" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, capability: "manage_reviews" },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, capability: "manage_blog" },
  { href: "/admin/giveaways", label: "Giveaways", icon: Gift, capability: "manage_giveaways" },
  { href: "/admin/faqs", label: "FAQs", icon: MessageSquareQuote, capability: "manage_faqs" },
  { href: "/admin/donations", label: "Donations", icon: Coffee, capability: "manage_donations" },
  { href: "/admin/sections", label: "Layout", icon: LayoutPanelTop, capability: "manage_layout" },
  { href: "/admin/settings", label: "Settings", icon: Settings, capability: "manage_settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile || !isStaff(profile)) redirect("/");

  const visibleNav = nav.filter(
    (item) => item.capability === null || can(profile, item.capability)
  );

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
          {can(profile, "manage_team") && (
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
          {can(profile, "manage_team") && (
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
