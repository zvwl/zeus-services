"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRates, saveSettings } from "@/app/admin/actions";
import { Button, Card } from "@/components/ui";
import { ImageUpload } from "@/components/ImageUpload";
import type { ExchangeRate } from "@/lib/types";

const GENERAL_FIELDS: {
  key: string;
  label: string;
  placeholder: string;
  textarea?: boolean;
  help?: string;
}[] = [
  {
    key: "site_name",
    label: "Site name",
    placeholder: "Zeuservices",
    help: "Shown in the navbar, footer, browser tab and emails.",
  },
  {
    key: "tagline",
    label: "Tagline",
    placeholder: "Premium game top-ups, boosting and accounts…",
    textarea: true,
    help: "One or two sentences. Appears in the footer and as the SEO description search engines show.",
  },
  {
    key: "announcement",
    label: "Announcement bar",
    placeholder: "SUMMER SALE — 20% off all top-ups this week!",
    help: "Banner shown at the very top of every storefront page. Visitors can dismiss it. Leave empty to hide the bar.",
  },
  {
    key: "support_email",
    label: "Support email",
    placeholder: "support@yourdomain.com",
    help: "Shown on the support page. Optional — leave blank if you don't have a mailbox yet.",
  },
];

const COMMUNITY_FIELDS: { key: string; label: string; placeholder: string; help?: string }[] = [
  {
    key: "discord_invite",
    label: "Discord invite URL",
    placeholder: "https://discord.gg/yourserver",
    help: "Also powers the “Join our Discord” homepage section — that section hides itself if this is empty.",
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
          <div>
            <h2 className="font-bold text-white">Branding</h2>
            <p className="mt-1 text-xs text-zinc-500">
              How the store presents itself — name, logo, tagline and the
              announcement bar. Changes go live immediately.
            </p>
          </div>
          <div>
            <ImageUpload
              folder="branding"
              value={logoUrl}
              onChange={setLogoUrl}
              label="Site logo"
            />
            <p className="mt-1 text-xs text-zinc-600">
              Shown in the navbar & footer. PNG or SVG with a transparent
              background works best. Leave empty to use the default ⚡ logo mark.
            </p>
          </div>
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
              {f.help && <p className="mt-1 text-xs text-zinc-600">{f.help}</p>}
            </div>
          ))}
          <div className="border-t border-edge pt-4">
            <h2 className="font-bold text-white">Community & socials</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Links shown as icons in the footer. Leave any of them empty to
              hide that icon.
            </p>
          </div>
          {COMMUNITY_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input
                name={`setting_${f.key}`}
                className="input"
                defaultValue={settings[f.key] ?? ""}
                placeholder={f.placeholder}
              />
              {f.help && <p className="mt-1 text-xs text-zinc-600">{f.help}</p>}
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
              All prices are set in USD; the storefront converts them using
              these rates. Each rate = how much 1 USD is worth in that currency
              (e.g. EUR 0.92 means $10 shows as €9.20). Customers pick their
              currency in the navbar and pay in it at checkout.
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
