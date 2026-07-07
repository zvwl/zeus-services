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
import { MailCheck } from "lucide-react";

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
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <MailCheck className="h-7 w-7 text-primary-light" />
          </span>
          <p className="text-sm leading-relaxed text-zinc-400">
            If an account exists for{" "}
            <span className="font-semibold text-white">{email}</span>, a reset
            link is on its way. Check your inbox (and spam folder).
          </p>
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center rounded-xl px-4 text-sm text-primary-light transition hover:underline"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="label">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              className="input min-h-[44px]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <Turnstile
            ref={turnstileRef}
            onVerify={setCaptchaToken}
            onExpire={() => setCaptchaToken("")}
            className="flex justify-center"
          />
          <Button
            size="lg"
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
