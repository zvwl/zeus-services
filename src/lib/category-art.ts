import { Coins, Gamepad2, TrendingUp, UserCheck, type LucideIcon } from "lucide-react";

/**
 * Canonical category → visual (icon + Higgsfield header art) mapping, matched
 * by slug/name keywords. Single source of truth — the category page and the
 * homepage SectionRenderer must both resolve visuals through this table so a
 * category never shows one icon on the homepage and different art on its own
 * page. Categories that match nothing fall back to the gamepad icon and the
 * plain (art-free) header.
 */
const TABLE: { pattern: RegExp; Icon: LucideIcon; art: string | null }[] = [
  {
    pattern: /top.?up|currenc|coin|credit|point/i,
    Icon: Coins,
    art: "/media/cat-topups.webp",
  },
  {
    pattern: /boost|rank|level/i,
    Icon: TrendingUp,
    art: "/media/cat-boosting.webp",
  },
  { pattern: /account/i, Icon: UserCheck, art: "/media/cat-accounts.webp" },
];

export function categoryVisual(cat: { name: string; slug: string }): {
  Icon: LucideIcon;
  art: string | null;
} {
  const haystack = `${cat.slug} ${cat.name}`;
  for (const { pattern, Icon, art } of TABLE) {
    if (pattern.test(haystack)) return { Icon, art };
  }
  return { Icon: Gamepad2, art: null };
}
