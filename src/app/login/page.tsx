"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, OAuthButtons } from "@/components/AuthShell";
import {
  Turnstile,
  captchaEnabled,
  type TurnstileHandle,
} from "@/components/Turnstile";
import { Button } from "@/components/ui";
import { MailCheck, ShieldCheck } from "lucide-react";
import { safeNextPath } from "@/lib/utils";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    urlError ? "Authentication failed. Please try again." : null
  );
  const [loading, setLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [code, setCode] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const turnstileRef = useRef<TurnstileHandle>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      // Turnstile tokens are single-use — get a fresh one for the retry.
      turnstileRef.current?.reset();
      setCaptchaToken("");
      return;
    }
    // If the account has 2FA enrolled we must step up to AAL2.
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      setMfaStep(true);
      setLoading(false);
      return;
    }
    // Full-document navigation on purpose: a soft router navigation can replay
    // a redirect the client router cached before the auth state changed (see
    // verify-2fa/page.tsx). A document request re-runs middleware with the
    // fresh session cookies.
    window.location.assign(next);
  }

  async function verifyMfa() {
    if (loading) return;
    setError(null);
    setLoading(true);
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
      setError("No authenticator found on this account.");
      setLoading(false);
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
    // Full-document navigation — same rationale as handleLogin above.
    window.location.assign(next);
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    await verifyMfa();
  }

  // Auto-submit as soon as all 6 digits are entered.
  useEffect(() => {
    if (mfaStep && code.length === 6 && !loading) {
      verifyMfa();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, mfaStep]);

  // Passwordless login — emails a one-click link (works for admins too).
  async function handleMagicLink() {
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter your email above first, then request a link.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        captchaToken,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      turnstileRef.current?.reset();
      setCaptchaToken("");
      return;
    }
    setMagicSent(true);
  }

  if (magicSent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We sent a one-click login link."
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <MailCheck className="h-7 w-7 text-primary-light" />
          </span>
          <p className="text-sm leading-relaxed text-zinc-400">
            A login link is on its way to{" "}
            <span className="font-semibold text-white">{email}</span>. Open it
            on this device to sign in. The link expires shortly.
          </p>
          <button
            onClick={() => setMagicSent(false)}
            className="min-h-[44px] w-full rounded-xl text-center text-sm text-primary-light transition hover:underline"
          >
            Back to login
          </button>
        </div>
      </AuthShell>
    );
  }

  if (mfaStep) {
    return (
      <AuthShell
        title="Two-factor authentication"
        subtitle="Enter the 6-digit code from your authenticator app."
      >
        <form onSubmit={handleMfa} className="space-y-5">
          <div className="flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
              <ShieldCheck className="h-7 w-7 text-primary-light" />
            </span>
          </div>
          <div>
            <label htmlFor="login-mfa-code" className="sr-only">
              6-digit authentication code
            </label>
            <input
              id="login-mfa-code"
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
            disabled={loading || code.length !== 6}
          >
            {loading ? "Verifying…" : "Verify"}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to track orders, save details and enter giveaways."
    >
      <OAuthButtons next={next} />
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="label">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className="input min-h-[44px]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="label">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary-light hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            className="input min-h-[44px]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
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
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <button
          type="button"
          onClick={handleMagicLink}
          disabled={loading || (captchaEnabled && !captchaToken)}
          className="min-h-[44px] w-full rounded-xl text-center text-sm text-zinc-400 transition hover:text-primary-light disabled:opacity-50"
        >
          Email me a login link instead
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-500">
        New here?{" "}
        <Link href="/signup" className="text-primary-light hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    // The fallback MUST reserve the same min-height as AuthShell's container:
    // an empty pending boundary lets the footer paint at the top of the
    // viewport, then the streamed form shoves it down a full screen
    // (measured CLS 0.775 in lab).
    <Suspense
      fallback={<div className="min-h-[calc(100svh-4rem)]" aria-hidden />}
    >
      <LoginForm />
    </Suspense>
  );
}
