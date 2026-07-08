import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { can, getProfile } from "@/lib/auth";
import { sanitizeSearchTerm } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";

// CSV export of the orders list, honoring the same query params as the admin
// orders page. Route handlers don't inherit the admin layout's guard, so this
// enforces the capability itself.

const RANGES: Record<string, number> = { today: 1, "7d": 7, "30d": 30 };

const csvCell = (v: string | number | null | undefined) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  const profile = await getProfile();
  if (!can(profile, "manage_orders")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "";
  const rangeKey = url.searchParams.get("range") ?? "";
  const search = (url.searchParams.get("q") ?? "").trim();

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (status && status !== "all") query = query.eq("status", status);
  if (RANGES[rangeKey]) {
    query = query.gte(
      "created_at",
      new Date(Date.now() - RANGES[rangeKey] * 86_400_000).toISOString()
    );
  }
  if (search) {
    if (/^#?\d+$/.test(search)) {
      query = query.eq("order_number", Number(search.replace(/^#/, "")));
    } else {
      const safe = sanitizeSearchTerm(search);
      if (safe) query = query.or(`email.ilike.%${safe}%,reference.ilike.%${safe}%`);
    }
  }

  const { data } = await query;
  const orders = (data as (Order & { items: OrderItem[] })[]) ?? [];

  const header = [
    "reference",
    "order_number",
    "date",
    "email",
    "status",
    "currency",
    "total",
    "subtotal_usd",
    "items",
  ].join(",");
  const rows = orders.map((o) =>
    [
      csvCell(o.reference),
      csvCell(o.order_number),
      csvCell(o.created_at),
      csvCell(o.email),
      csvCell(o.status),
      csvCell(o.currency),
      csvCell(Number(o.total).toFixed(2)),
      csvCell(Number(o.subtotal_usd).toFixed(2)),
      csvCell(
        (o.items ?? [])
          .map(
            (i) =>
              `${i.quantity}x ${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ""}`
          )
          .join(" | ")
      ),
    ].join(",")
  );

  return new Response([header, ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zeuservices-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
