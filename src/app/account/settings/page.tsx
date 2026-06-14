"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/components/CurrencyProvider";
import { ImageUpload } from "@/components/ImageUpload";
import { Button, Card, Spinner, Badge } from "@/components/ui";
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
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <Card>
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
            <label className="label">Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Preferred currency</label>
            <select
              className="input"
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
          <Button disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-5 font-bold text-white">Email address</h2>
          <form onSubmit={changeEmail} className="space-y-4">
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button variant="outline" disabled={saving || email === user?.email}>
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
                className="flex items-center justify-between rounded-xl border border-edge bg-raised/50 px-4 py-3"
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
                    onClick={() => linkProvider(provider)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            Linking Discord lets us verify giveaway entries and deliver faster
            support.
          </p>
        </Card>
      </div>

      {msg && (
        <p
          className={`lg:col-span-2 rounded-xl border px-4 py-3 text-sm ${
            msg.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
