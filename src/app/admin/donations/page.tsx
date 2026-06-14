import { createClient } from "@/lib/supabase/server";
import { Badge, statusBadgeVariant } from "@/components/ui";
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

      <div className="glass mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-edge text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3">Supporter</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {donations.map((d) => (
              <tr key={d.id} className="transition hover:bg-raised/40">
                <td className="px-4 py-3 font-medium text-white">
                  {d.name || "Anonymous"}
                </td>
                <td className="max-w-[260px] truncate px-4 py-3 text-zinc-400">
                  {d.message ?? "—"}
                </td>
                <td className="px-4 py-3 font-semibold text-gold">
                  {formatMoney(Number(d.amount), d.currency)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadgeVariant(d.status)}>{d.status}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {formatDateTime(d.created_at)}
                </td>
              </tr>
            ))}
            {donations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  No donations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
