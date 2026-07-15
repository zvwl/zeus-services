"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui";

export function VerifyForm({
  next,
  logoUrl,
}: {
  next: string;
  logoUrl: string | null;
}) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Pre-hydration Enter fires a native GET submit that reloads the page and
  // wipes typed input — keep submit disabled until React owns the form.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  async function verify() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      // supabase-js (~64KB gz) loads on demand — it's only needed at submit
      // time, so it stays off the hydration critical path.
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: factors, error: factorsError } =
        await supabase.auth.mfa.listFactors();
      if (factorsError) {
        setError("Couldn't reach the authentication service — try again.");
        setLoading(false);
        return;
      }
      const totp = factors?.totp?.[0];
      if (!totp) {
        // No usable factor — nothing to step up to; send them on their way.
        window.location.assign(next);
        return;
      }
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totp.id,
        code: code.trim(),
      });
      if (error) {
        setError("Invalid code — try again.");
        setCode("");
        setLoading(false);
        return;
      }
      // Full-document navigation on purpose. A soft router navigation can
      // replay a prefetched middleware redirect from before the step-up (the
      // client router caches the AAL1-era 307 for `next` for up to 5
      // minutes), landing back on this page and leaving the form stuck on
      // "Verifying…". A document request always re-runs middleware against
      // the fresh AAL2 cookies.
      window.location.assign(next);
    } catch {
      // Chunk-load failure (deploy skew, dropped connection) — a stuck
      // `loading` here would also block the auto-submit effect for good.
      setError("Couldn't reach the authentication service — try again.");
      setLoading(false);
    }
  }

  // Auto-submit once all six digits are entered.
  useEffect(() => {
    if (code.length === 6 && !loading) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function signOut() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
    } catch {
      setError("Couldn't reach the authentication service — try again.");
    }
  }

  return (
    <AuthShell
      title="Two-factor authentication"
      subtitle="Enter the 6-digit code from your authenticator app to continue."
      logoUrl={logoUrl}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify();
        }}
        className="space-y-5"
      >
        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <ShieldCheck className="h-7 w-7 text-primary-light" />
          </span>
        </div>
        <div>
          <label htmlFor="verify-2fa-code" className="sr-only">
            6-digit authentication code
          </label>
          <input
            id="verify-2fa-code"
            className="input min-h-[52px] text-center font-mono text-2xl tracking-[0.5em]"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoComplete="one-time-code"
            autoFocus
          />
        </div>
        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <Button
          size="lg"
          className="w-full"
          disabled={loading || !hydrated || code.length !== 6}
        >
          {loading ? "Verifying…" : "Verify"}
        </Button>
        <button
          type="button"
          onClick={signOut}
          className="min-h-[44px] w-full rounded-xl text-center text-sm text-zinc-400 transition hover:text-primary-light"
        >
          Sign in with a different account
        </button>
      </form>
    </AuthShell>
  );
}
