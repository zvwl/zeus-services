export type Role = "customer" | "support" | "admin" | "super_admin";

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  role: Role;
  /**
   * Per-staff capability override. `null` = use the role's default capabilities
   * (see ROLE_DEFAULT_CAPABILITIES); a set array = exactly these capabilities.
   * Only meaningful for support/admin — super_admin always has everything.
   */
  capabilities: Capability[] | null;
  preferred_currency: string;
  discord_id: string | null;
  discord_username: string | null;
  is_banned: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  intro: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  /** Hand-written SERP overrides; optional so code tolerates pre-0021 schemas. */
  meta_title?: string | null;
  meta_description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  intro: string | null;
  image_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  /** Hand-written SERP overrides; optional so code tolerates pre-0021 schemas. */
  meta_title?: string | null;
  meta_description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type DeliveryType = "instant" | "manual";

export interface Product {
  id: string;
  game_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  compare_at_price: number | null;
  delivery_type: DeliveryType;
  delivery_instructions: string | null;
  stock: number | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  // Pricing mode: "fixed" = base price / variants; "custom" = slider amount × unit price.
  pricing_mode: "fixed" | "custom";
  custom_unit_label: string | null;
  custom_price_per_unit: number | null;
  custom_min: number | null;
  custom_max: number | null;
  custom_step: number | null;
  /** Hand-written SERP overrides; optional so code tolerates pre-0021 schemas. */
  meta_title?: string | null;
  meta_description?: string | null;
  game?: Game | null;
  category?: Category | null;
  variants?: ProductVariant[];
  fields?: ProductField[];
  addons?: ProductAddon[];
}

/** An optional bundle item a buyer can add to a product at checkout. */
export interface ProductAddon {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  stock: number | null;
  sort_order: number;
  is_active: boolean;
}

export type FieldType = "text" | "email" | "password" | "select" | "textarea";

export interface ProductField {
  id: string;
  product_id: string;
  label: string;
  field_type: FieldType;
  placeholder: string | null;
  options: string[];
  required: boolean;
  sort_order: number;
}

export interface ExchangeRate {
  code: string;
  rate: number;
  symbol: string;
  label: string;
}

/**
 * A single line in the shopping cart. Carries a display snapshot (name, image,
 * USD unit price) so the cart renders instantly without re-fetching — the
 * checkout API always re-validates price/stock server-side, so the snapshot is
 * never trusted for charging. `key` is a stable id derived from
 * product+variant+customFields (see lib/cart `cartLineKey`).
 */
export interface CartLine {
  key: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  variantId: string | null;
  variantName: string | null;
  unitPriceUsd: number;
  quantity: number;
  deliveryType: DeliveryType;
  customFields: Record<string, string>;
  /** Custom-amount products: the chosen amount + a display label (e.g. "5,000 gold"). */
  customAmount?: number | null;
  customLabel?: string | null;
  /** Selected add-on bundle items (display snapshot; re-validated at checkout). */
  addons?: { id: string; name: string; price: number }[];
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "completed"
  | "cancelled"
  | "refunded";

export interface Order {
  id: string;
  order_number: number;
  reference: string | null;
  user_id: string | null;
  email: string | null;
  status: OrderStatus;
  currency: string;
  exchange_rate: number;
  subtotal_usd: number;
  total: number;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  created_at: string;
  items?: OrderItem[];
  profile?: Pick<Profile, "username" | "email"> | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  unit_price_usd: number;
  custom_fields: Record<string, string>;
  delivered_payload: string | null;
  delivered_at: string | null;
}

export interface Review {
  id: string;
  user_id: string | null;
  author_name: string | null;
  author_avatar: string | null;
  product_id: string | null;
  rating: number;
  title: string | null;
  content: string;
  is_approved: boolean;
  is_featured: boolean;
  admin_reply: string | null;
  created_at: string;
  profile?: Pick<Profile, "username" | "avatar_url"> | null;
}

export interface BlogPost {
  id: string;
  author_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  /** Hand-written SERP overrides; optional so code tolerates pre-0021 schemas. */
  meta_title?: string | null;
  meta_description?: string | null;
  author?: Pick<Profile, "username" | "avatar_url"> | null;
}

/** Admin-editable markdown page (terms, privacy, refunds, …). */
export interface SitePage {
  slug: string;
  title: string;
  content: string;
  updated_at: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export interface Giveaway {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  prize: string;
  ends_at: string;
  is_active: boolean;
  winner_user_id: string | null;
  requirement_text: string | null;
  created_at: string;
  winner?: Pick<Profile, "username"> | null;
}

export type TicketStatus = "open" | "answered" | "closed";

export interface SupportTicket {
  id: string;
  ticket_number: number;
  user_id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: "low" | "normal" | "high";
  created_at: string;
  updated_at: string;
  profile?: Pick<Profile, "username" | "email" | "avatar_url"> | null;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  is_staff: boolean;
  message: string;
  created_at: string;
}

export interface Donation {
  id: string;
  user_id: string | null;
  name: string | null;
  message: string | null;
  amount: number;
  currency: string;
  status: "pending" | "completed";
  created_at: string;
}

export type SectionKind =
  | "hero"
  | "categories"
  | "featured_products"
  | "games"
  | "stats"
  | "reviews"
  | "faq"
  | "steps"
  | "cta_banner"
  | "discord"
  | "giveaway"
  | "rich_text";

export interface SiteSection {
  id: string;
  kind: SectionKind;
  title: string | null;
  subtitle: string | null;
  content: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
}

export type SiteSettings = Record<string, unknown>;

export interface AuditLog {
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  actor?: Pick<Profile, "username"> | null;
}

export const STAFF_ROLES: Role[] = ["support", "admin", "super_admin"];
export const ADMIN_ROLES: Role[] = ["admin", "super_admin"];

/* ─────────────────── Staff capabilities (granular permissions) ───────────────────
 * Each capability maps to one admin section / set of actions. A super_admin can
 * grant any subset to an individual staff member, overriding their role default.
 * `manage_team` is special: it controls roles + permissions themselves, so it is
 * always super-admin-only and can never be granted to a lower role. */
export const CAPABILITIES = [
  { key: "manage_orders", label: "Orders", group: "Operations" },
  { key: "issue_refunds", label: "Issue refunds", group: "Operations" },
  { key: "manage_support", label: "Support tickets", group: "Operations" },
  { key: "manage_customers", label: "Customers & bans", group: "Operations" },
  { key: "manage_products", label: "Products", group: "Catalog" },
  { key: "manage_games", label: "Games", group: "Catalog" },
  { key: "manage_categories", label: "Categories", group: "Catalog" },
  { key: "manage_reviews", label: "Reviews", group: "Content" },
  { key: "manage_blog", label: "Blog", group: "Content" },
  { key: "manage_giveaways", label: "Giveaways", group: "Content" },
  { key: "manage_faqs", label: "FAQs", group: "Content" },
  { key: "manage_donations", label: "Donations", group: "Content" },
  { key: "manage_layout", label: "Homepage layout", group: "Site" },
  { key: "manage_pages", label: "Site pages", group: "Site" },
  { key: "manage_settings", label: "Settings & rates", group: "Site" },
  { key: "manage_team", label: "Team & permissions", group: "Site" },
] as const;

export type Capability = (typeof CAPABILITIES)[number]["key"];
export const ALL_CAPABILITIES: Capability[] = CAPABILITIES.map((c) => c.key);

/** Sentinel for setUserCapabilities: reset a staff member to role defaults (capabilities = null). */
export const CAPABILITIES_DEFAULT = "__default__";

export const ROLE_DEFAULT_CAPABILITIES: Record<Role, Capability[]> = {
  customer: [],
  support: ["manage_orders", "manage_support", "manage_customers"],
  admin: ALL_CAPABILITIES.filter((c) => c !== "manage_team"),
  super_admin: [...ALL_CAPABILITIES],
};

/** Effective capabilities for a (role, capabilities-override) pair. Pure — safe
 *  to use in middleware and on the client. */
export function resolveCapabilities(
  role: Role | null | undefined,
  capabilities: Capability[] | string[] | null | undefined
): Capability[] {
  if (!role || !STAFF_ROLES.includes(role)) return [];
  if (role === "super_admin") return [...ALL_CAPABILITIES];
  const base = (capabilities ?? ROLE_DEFAULT_CAPABILITIES[role]) as string[];
  return ALL_CAPABILITIES.filter(
    (c) => c !== "manage_team" && base.includes(c)
  );
}

const PATH_CAPABILITY: [string, Capability][] = [
  ["/admin/orders", "manage_orders"],
  ["/admin/customers", "manage_customers"],
  ["/admin/support", "manage_support"],
  ["/admin/products", "manage_products"],
  ["/admin/games", "manage_games"],
  ["/admin/categories", "manage_categories"],
  ["/admin/reviews", "manage_reviews"],
  ["/admin/blog", "manage_blog"],
  ["/admin/giveaways", "manage_giveaways"],
  ["/admin/faqs", "manage_faqs"],
  ["/admin/donations", "manage_donations"],
  ["/admin/sections", "manage_layout"],
  ["/admin/pages", "manage_pages"],
  ["/admin/settings", "manage_settings"],
  ["/admin/team", "manage_team"],
];

/** The capability required to open an /admin path, or null for the dashboard
 *  (any staff member may see it). */
export function pathCapability(path: string): Capability | null {
  for (const [prefix, cap] of PATH_CAPABILITY) {
    if (path === prefix || path.startsWith(prefix + "/")) return cap;
  }
  return null;
}
