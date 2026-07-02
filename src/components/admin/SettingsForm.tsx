"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRates, saveSettings } from "@/app/admin/actions";
import { Button, Card } from "@/components/ui";
import { ImageUpload } from "@/components/ImageUpload";
import type { ExchangeRate } from "@/lib/types";

const GENERAL_FIELDS: { key: string; label: string; placeholder: string; textarea?: boolean }[] = [
  { key: "site_name", label: "Site name", placeholder: "Zeuservices" },
  {
    key: "tagline",
    label: "Tagline (footer + SEO description)",
    placeholder: "Premium game top-ups, boosting and accounts…",
    textarea: true,
  },
  {
    key: "announcement",
    label: "Announcement bar (empty = hidden)",
    placeholder: "SUMMER SALE — 20% off all top-ups this week!",
  },
  {
    key: "support_email",
    label: "Support email",
    placeholder: "support@zeus-services.com",
  },
];

const COMMUNITY_FIELDS: { key: string; label: string; placeholder: string }[] = [
  {
    key: "discord_invite",
    label: "Discord invite URL",
    placeholder: "https://discord.gg/yourserver",
  },
  { key: "twitter_url", label: "X / Twitter URL", placeholder: "https://x.com/…" },
  { key: "youtube_url", label: "YouTube URL", placeholder: "https://youtube.com/@…" },
  { key: "tiktok_url", label: "TikTok URL", placeholder: "https://tiktok.com/@…" },
];

function Feedback({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p
      className={`rounded-xl border px-3 py-2 text-sm ${
        msg.ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-red-500/30 bg-red-500/10 text-red-300"
      }`}
    >
      {msg.text}
    </p>
  );
}

export function SettingsForm({
  settings,
  rates,
}: {
  settings: Record<string, string>;
  rates: ExchangeRate[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ratesMsg, setRatesMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(settings["logo_url"] || null);

  return (
    <div className="space-y-6">
      <form
        action={(formData) =>
          startTransition(async () => {
            const res = await saveSettings(formData);
            setMsg({ ok: res.ok, text: res.message });
            router.refresh();
          })
        }
      >
        <Card className="space-y-4">
          <h2 className="font-bold text-white">General</h2>
          <ImageUpload
            folder="branding"
            value={logoUrl}
            onChange={setLogoUrl}
            label="Site logo — shown in the navbar & footer (PNG or SVG, transparent background works best). Leave empty to use the default logo mark."
          />
          <input type="hidden" name="setting_logo_url" value={logoUrl ?? ""} />
          {GENERAL_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              {f.textarea ? (
                <textarea
                  name={`setting_${f.key}`}
                  className="input min-h-[70px]"
                  defaultValue={settings[f.key] ?? ""}
                  placeholder={f.placeholder}
                />
              ) : (
                <input
                  name={`setting_${f.key}`}
                  className="input"
                  defaultValue={settings[f.key] ?? ""}
                  placeholder={f.placeholder}
                />
              )}
            </div>
          ))}
          <h2 className="pt-2 font-bold text-white">Community</h2>
          {COMMUNITY_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input
                name={`setting_${f.key}`}
                className="input"
                defaultValue={settings[f.key] ?? ""}
                placeholder={f.placeholder}
              />
            </div>
          ))}
          <Feedback msg={msg} />
          <Button disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
        </Card>
      </form>

      <form
        action={(formData) =>
          startTransition(async () => {
            const res = await saveRates(formData);
            setRatesMsg({ ok: res.ok, text: res.message });
            router.refresh();
          })
        }
      >
        <Card className="space-y-4">
          <div>
            <h2 className="font-bold text-white">Currencies & exchange rates</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Prices are stored in USD. Each rate = how much 1 USD is worth in
              that currency. Customers can pay in any of these at checkout.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {rates.map((r) => (
              <div
                key={r.code}
                className="flex items-center gap-3 rounded-xl border border-edge bg-raised/40 px-4 py-3"
              >
                <span className="w-12 font-bold text-white">{r.code}</span>
                <span className="flex-1 text-xs text-zinc-500">{r.label}</span>
                {r.code === "USD" ? (
                  <span className="w-28 text-right font-mono text-sm text-zinc-500">
                    1.000000
                  </span>
                ) : (
                  <input
                    type="number"
                    step="0.000001"
                    min="0.000001"
                    name={`rate_${r.code}`}
                    defaultValue={Number(r.rate)}
                    className="input w-28 text-right font-mono"
                  />
                )}
              </div>
            ))}
          </div>
          <Feedback msg={ratesMsg} />
          <Button disabled={pending}>{pending ? "Saving…" : "Save rates"}</Button>
        </Card>
      </form>
    </div>
  );
}
