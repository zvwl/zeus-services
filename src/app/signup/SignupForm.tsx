"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { AuthShell, OAuthButtons } from "@/components/AuthShell";
import {
  Turnstile,
  captchaEnabled,
  type TurnstileHandle,
} from "@/components/Turnstile";
import { Button } from "@/components/ui";

export function SignupForm({ logoUrl }: { logoUrl: string | null }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);
  // Pre-hydration Enter fires a native GET submit that reloads the page and
  // wipes typed input — keep submit disabled until React owns the form.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  async function handleSignup(e: React.FormEvent) {
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
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError("Username must be 3–20 characters (letters, numbers, _).");
      return;
    }
    setLoading(true);
    try {
      // supabase-js (~64KB gz) loads on demand — it's only needed at submit
      // time, so it stays off the hydration critical path.
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          captchaToken,
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        // Turnstile tokens are single-use — get a fresh one for the retry.
        turnstileRef.current?.reset();
        setCaptchaToken("");
        return;
      }
      if (!data.session) {
        // Email confirmation is enabled — tell the user to verify.
        setVerifySent(true);
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      // Chunk-load failure (deploy skew, dropped connection) — without this
      // the form spins on "Creating account…" forever.
      setError("Couldn't reach the authentication service — try again.");
      setLoading(false);
      turnstileRef.current?.reset();
      setCaptchaToken("");
    }
  }

  if (verifySent) {
    return (
      <AuthShell title="Verify your email" logoUrl={logoUrl}>
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <MailCheck className="h-7 w-7 text-primary-light" />
          </span>
          <p className="text-sm leading-relaxed text-zinc-400">
            We&apos;ve sent a verification link to{" "}
            <span className="font-semibold text-white">{email}</span>. Click the
            link to activate your account, then log in.
          </p>
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center rounded-xl px-4 text-sm text-primary-light transition hover:underline"
          >
            Back to login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Track orders, save your details and enter giveaways."
      logoUrl={logoUrl}
    >
      <OAuthButtons />
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="signup-username" className="label">
            Username
          </label>
          <input
            id="signup-username"
            className="input min-h-[44px]"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="zeus_gamer"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label htmlFor="signup-email" className="label">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            className="input min-h-[44px]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
          <div>
            <label htmlFor="signup-password" className="label">
              Password
            </label>
            <input
              id="signup-password"
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
            <label htmlFor="signup-confirm" className="label">
              Confirm
            </label>
            <input
              id="signup-confirm"
              type="password"
              className="input min-h-[44px]"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
          </div>
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
          disabled={loading || !hydrated || (captchaEnabled && !captchaToken)}
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-xs leading-relaxed text-zinc-500">
          By signing up you agree to our{" "}
          <Link href="/terms" className="text-zinc-400 underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-zinc-400 underline">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-500">
        Already registered?{" "}
        <Link href="/login" className="text-primary-light hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
