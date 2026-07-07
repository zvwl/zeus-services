"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/components/CurrencyProvider";
import { ImageUpload } from "@/components/ImageUpload";
import { Button, Card, Spinner, Badge } from "@/components/ui";
import { RevealGroup, RevealItem } from "@/components/motion";
import type { User } from "@supabase/supabase-js";

export default function AccountSettingsPage() {
  const { rates, currency, setCurrency } = useCurrency();
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [preferredCurrency, setPreferredCurrency] = useState(currency);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      setUserId(user.id);
      setEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        setUsername(profile.username ?? "");
        setAvatarUrl(profile.avatar_url);
        setPreferredCurrency(profile.preferred_currency ?? "USD");
      }
      setLoading(false);
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setMsg(null);
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setMsg({ ok: false, text: "Username must be 3–20 chars (letters, numbers, _)." });
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        username,
        avatar_url: avatarUrl,
        preferred_currency: preferredCurrency,
      })
      .eq("id", userId);
    if (error) {
      setMsg({
        ok: false,
        text: error.code === "23505" ? "That username is taken." : error.message,
      });
    } else {
      setCurrency(preferredCurrency);
      setMsg({ ok: true, text: "Profile saved." });
    }
    setSaving(false);
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email });
    setMsg(
      error
        ? { ok: false, text: error.message }
        : {
            ok: true,
            text: "Confirmation links sent — check both your old and new inbox.",
          }
    );
    setSaving(false);
  }

  async function linkProvider(provider: "discord" | "google") {
    const supabase = createClient();
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/account/settings`,
      },
    });
    if (error) setMsg({ ok: false, text: error.message });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const identities = user?.identities?.map((i) => i.provider) ?? [];

  return (
    <RevealGroup className="grid max-w-4xl gap-5 lg:grid-cols-2" stagger={0.07}>
      <RevealItem y={16}>
        <Card className="h-full">
          <h2 className="mb-5 font-bold text-white">Profile</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <ImageUpload
              bucket="zeus-avatars"
              folder={userId ?? "anon"}
              value={avatarUrl}
              onChange={setAvatarUrl}
              label="Avatar"
            />
            <div>
              <label htmlFor="settings-username" className="label">
                Username
              </label>
              <input
                id="settings-username"
                className="input min-h-[44px]"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="settings-currency" className="label">
                Preferred currency
              </label>
              <select
                id="settings-currency"
                className="input min-h-[44px]"
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
              >
                {rates.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.code} — {r.label}
                  </option>
                ))}
              </select>
            </div>
            <Button disabled={saving} className="min-h-[44px]">
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </Card>
      </RevealItem>

      <RevealItem y={16}>
        <div className="space-y-5">
          <Card>
            <h2 className="mb-5 font-bold text-white">Email address</h2>
            <form onSubmit={changeEmail} className="space-y-4">
              <div>
                <label htmlFor="settings-email" className="label">
                  Email
                </label>
                <input
                  id="settings-email"
                  type="email"
                  className="input min-h-[44px]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="min-h-[44px]"
                disabled={saving || email === user?.email}
              >
                Change email
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-5 font-bold text-white">Connected accounts</h2>
            <div className="space-y-3">
              {(["discord", "google"] as const).map((provider) => (
                <div
                  key={provider}
                  className="flex min-h-[56px] items-center justify-between rounded-xl border border-edge bg-raised/50 px-4 py-2"
                >
                  <span className="text-sm font-medium capitalize text-zinc-300">
                    {provider}
                  </span>
                  {identities.includes(provider) ? (
                    <Badge variant="success">✓ Connected</Badge>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-[40px]"
                      onClick={() => linkProvider(provider)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Linking Discord lets us verify giveaway entries and deliver faster
              support.
            </p>
          </Card>
        </div>
      </RevealItem>

      {msg && (
        <p
          role="status"
          className={`lg:col-span-2 rounded-xl border px-4 py-3 text-sm ${
            msg.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {msg.text}
        </p>
      )}
    </RevealGroup>
  );
}
