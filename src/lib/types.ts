export type Role = "customer" | "support" | "admin" | "super_admin";

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  role: Role;
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
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
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
  game?: Game | null;
  category?: Category | null;
  variants?: ProductVariant[];
  fields?: ProductField[];
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
  author?: Pick<Profile, "username" | "avatar_url"> | null;
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
