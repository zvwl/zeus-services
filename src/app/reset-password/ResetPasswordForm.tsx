"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui";

export function ResetPasswordForm({ logoUrl }: { logoUrl: string | null }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Pre-hydration Enter fires a native GET submit that reloads the page and
  // wipes typed input — keep submit disabled until React owns the form.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      // supabase-js (~64KB gz) loads on demand — it's only needed at submit
      // time, so it stays off the hydration critical path.
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      // Chunk-load failure (deploy skew, dropped connection) — without this
      // the form spins on "Updating…" forever.
      setError("Couldn't reach the authentication service — try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Set your password"
      subtitle="You're signed in — choose a password for your account below to finish up."
      logoUrl={logoUrl}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-password" className="label">
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            className="input min-h-[44px]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label htmlFor="reset-confirm" className="label">
            Confirm new password
          </label>
          <input
            id="reset-confirm"
            type="password"
            className="input min-h-[44px]"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            autoComplete="new-password"
            required
          />
        </div>
        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <Button size="lg" className="w-full" disabled={loading || !hydrated}>
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
