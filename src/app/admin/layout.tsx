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

// Each item is shown only to staff who hold its capability (from their role
// default or a per-staff override). The dashboard needs none. Grouped to mirror
// the capability groups in lib/types so a 15-item list reads as a few short,
// scannable sections. Mirrors the server-action + middleware capability guards.
type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  capability: Capability | null;
};

const NAV_GROUPS: { heading: string | null; items: NavItem[] }[] = [
  {
    heading: null,
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, capability: null },
    ],
  },
  {
    heading: "Operations",
    items: [
      { href: "/admin/orders", label: "Orders", icon: Package, capability: "manage_orders" },
      { href: "/admin/support", label: "Support", icon: LifeBuoy, capability: "manage_support" },
      { href: "/admin/customers", label: "Customers", icon: Users, capability: "manage_customers" },
    ],
  },
  {
    heading: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: ShoppingBag, capability: "manage_products" },
      { href: "/admin/games", label: "Games", icon: Gamepad2, capability: "manage_games" },
      { href: "/admin/categories", label: "Categories", icon: FolderTree, capability: "manage_categories" },
    ],
  },
  {
    heading: "Content",
    items: [
      { href: "/admin/reviews", label: "Reviews", icon: Star, capability: "manage_reviews" },
      { href: "/admin/blog", label: "Blog", icon: Newspaper, capability: "manage_blog" },
      { href: "/admin/giveaways", label: "Giveaways", icon: Gift, capability: "manage_giveaways" },
      { href: "/admin/faqs", label: "FAQs", icon: MessageSquareQuote, capability: "manage_faqs" },
      { href: "/admin/donations", label: "Donations", icon: Coffee, capability: "manage_donations" },
    ],
  },
  {
    heading: "Site",
    items: [
      { href: "/admin/sections", label: "Layout", icon: LayoutPanelTop, capability: "manage_layout" },
      { href: "/admin/settings", label: "Settings", icon: Settings, capability: "manage_settings" },
    ],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile || !isStaff(profile)) redirect("/");

  const visibleGroups = NAV_GROUPS.map((group) => ({
    heading: group.heading,
    items: group.items.filter(
      (item) => item.capability === null || can(profile, item.capability)
    ),
  })).filter((group) => group.items.length > 0);

  const flatMobileItems = visibleGroups.flatMap((g) => g.items);

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
        <nav className="flex flex-col gap-3">
          {visibleGroups.map((group, gi) => (
            <div key={group.heading ?? `group-${gi}`} className="flex flex-col gap-0.5">
              {group.heading && (
                <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  {group.heading}
                </p>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-raised hover:text-white"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
          {can(profile, "manage_team") && (
            <div className="flex flex-col gap-0.5">
              <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                Administration
              </p>
              <Link
                href="/admin/team"
                className="flex items-center gap-2.5 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-sm text-amber-300 transition hover:bg-amber-400/10"
              >
                <ShieldCheck className="h-4 w-4" />
                Team & roles
              </Link>
            </div>
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
          {flatMobileItems.map((item) => (
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
