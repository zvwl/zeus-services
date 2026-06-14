import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { SettingsForm } from "@/components/admin/SettingsForm";
import type { ExchangeRate } from "@/lib/types";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const [settings, { data: rates }] = await Promise.all([
    getSettings(),
    supabase.from("exchange_rates").select("*").order("code"),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-white">Site settings</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Branding, community links and currency exchange rates.
      </p>
      <div className="mt-6">
        <SettingsForm
          settings={Object.fromEntries(
            Object.entries(settings).map(([k, v]) => [k, String(v ?? "")])
          )}
          rates={(rates as ExchangeRate[]) ?? []}
        />
      </div>
    </div>
  );
}
