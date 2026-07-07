import { createClient } from "@/lib/supabase/server";
import { Badge, statusBadgeVariant } from "@/components/ui";
import { AdminTable } from "@/components/admin/AdminTable";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/utils";
import type { Donation } from "@/lib/types";

export const revalidate = 0;

export default async function AdminDonationsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const donations = (data as Donation[]) ?? [];
  const total = donations
    .filter((d) => d.status === "completed")
    .reduce((s, d) => s + Number(d.amount), 0);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-white">Donations</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Lifetime collected: <span className="font-bold text-gold">≈ {formatMoney(total, "USD")}</span>{" "}
        (mixed currencies, shown nominally)
      </p>

      <div className="mt-6">
        <AdminTable
          minWidth={560}
          empty="No donations yet — supporters who buy you a coffee will show up here."
          columns={[
            { header: "Supporter" },
            { header: "Message" },
            { header: "Amount" },
            { header: "Status" },
            { header: "Date" },
          ]}
          rows={donations.map((d) => ({
            key: d.id,
            cells: [
              <span key="name" className="font-medium text-white">
                {d.name || "Anonymous"}
              </span>,
              <span key="msg" className="block max-w-[260px] truncate text-zinc-400">
                {d.message ?? "—"}
              </span>,
              <span key="amount" className="font-semibold text-gold">
                {formatMoney(Number(d.amount), d.currency)}
              </span>,
              <Badge key="status" variant={statusBadgeVariant(d.status)}>
                {d.status}
              </Badge>,
              <span key="date" className="text-xs text-zinc-500">
                {formatDateTime(d.created_at)}
              </span>,
            ],
          }))}
        />
      </div>
    </div>
  );
}
