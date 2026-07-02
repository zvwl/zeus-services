"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui";
import { safeNextPath } from "@/lib/utils";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function verify() {
    if (loading) return;
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totp = factors?.totp?.[0];
    if (!totp) {
      // No usable factor — nothing to step up to; send them on their way.
      router.replace(next);
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
    router.replace(next);
    router.refresh();
  }

  // Auto-submit once all six digits are entered.
  useEffect(() => {
    if (code.length === 6 && !loading) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <AuthShell
      title="Two-factor authentication"
      subtitle="Enter the 6-digit code from your authenticator app to continue."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify();
        }}
        className="space-y-4"
      >
        <div className="flex justify-center">
          <ShieldCheck className="h-10 w-10 text-primary-light" />
        </div>
        <input
          className="input text-center text-2xl tracking-[0.5em]"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          autoComplete="one-time-code"
          autoFocus
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button className="w-full" disabled={loading || code.length !== 6}>
          {loading ? "Verifying…" : "Verify"}
        </Button>
        <button
          type="button"
          onClick={signOut}
          className="w-full text-center text-sm text-zinc-500 hover:text-primary-light"
        >
          Sign in with a different account
        </button>
      </form>
    </AuthShell>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
