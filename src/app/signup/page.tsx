"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell, OAuthButtons } from "@/components/AuthShell";
import {
  Turnstile,
  captchaEnabled,
  type TurnstileHandle,
} from "@/components/Turnstile";
import { Button } from "@/components/ui";

export default function SignupPage() {
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
  }

  if (verifySent) {
    return (
      <AuthShell title="Verify your email">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <MailCheck className="h-7 w-7 text-primary-light" />
          </span>
          <p className="text-sm leading-relaxed text-zinc-400">
            We&apos;ve sent a verification link to{" "}
            <span className="font-semibold text-white">{email}</span>. Click the
            link to activate your account, then log in.
          </p>
          <Link href="/login" className="text-sm text-primary-light hover:underline">
            Back to login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        <>
          Already registered?{" "}
          <Link href="/login" className="text-primary-light hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <OAuthButtons />
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="label">Username</label>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="zeus_gamer"
            required
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
            />
          </div>
          <div>
            <label className="label">Confirm</label>
            <input
              type="password"
              className="input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
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
          className="w-full"
          disabled={loading || (captchaEnabled && !captchaToken)}
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-xs text-zinc-600">
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
    </AuthShell>
  );
}
