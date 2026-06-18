"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AuthShell";
import {
  Turnstile,
  captchaEnabled,
  type TurnstileHandle,
} from "@/components/Turnstile";
import { Button } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      captchaToken,
    });
    if (error) {
      setError(error.message);
      // Turnstile tokens are single-use — get a fresh one for the retry.
      turnstileRef.current?.reset();
      setCaptchaToken("");
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure reset link."
    >
      {sent ? (
        <div className="text-center text-sm text-zinc-400">
          <p>
            If an account exists for{" "}
            <span className="font-semibold text-white">{email}</span>, a reset
            link is on its way. Check your inbox (and spam folder).
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-primary-light hover:underline"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Turnstile
            ref={turnstileRef}
            onVerify={setCaptchaToken}
            onExpire={() => setCaptchaToken("")}
            className="flex justify-center"
          />
          <Button
            className="w-full"
            disabled={loading || (captchaEnabled && !captchaToken)}
          >
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
