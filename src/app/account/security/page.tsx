"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import { KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cleanupUnverifiedMfa } from "@/app/actions";
import { Badge, Button, Card, Spinner } from "@/components/ui";
import { RevealGroup, RevealItem } from "@/components/motion";
import type { Factor, User } from "@supabase/supabase-js";

export default function SecurityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // password change
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // 2FA enrollment
  const [enrolling, setEnrolling] = useState<{
    factorId: string;
    qr: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // disabling 2FA (requires stepping up to AAL2 first)
  const [disablingId, setDisablingId] = useState<string | null>(null);
  const [disableCode, setDisableCode] = useState("");
  const [disabling, setDisabling] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-submit the 6-digit codes once fully entered.
  useEffect(() => {
    if (enrolling && code.length === 6 && !verifying) verifyEnroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, enrolling]);

  useEffect(() => {
    if (disablingId && disableCode.length === 6 && !disabling) confirmDisable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableCode, disablingId]);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (password !== confirm) {
      setMsg({ ok: false, text: "Passwords do not match." });
      return;
    }
    if (password.length < 8) {
      setMsg({ ok: false, text: "Password must be at least 8 characters." });
      return;
    }
    setSavingPw(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setMsg(
      error
        ? { ok: false, text: error.message }
        : { ok: true, text: "Password updated." }
    );
    setPassword("");
    setConfirm("");
    setSavingPw(false);
  }

  async function startEnroll() {
    setMsg(null);
    const supabase = createClient();
    // Clear any leftover unverified factor from a cancelled attempt — server
    // side, so it doesn't send a "2FA disabled" email.
    await cleanupUnverifiedMfa();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ")}`,
    });
    if (error || !data) {
      setMsg({ ok: false, text: error?.message ?? "Could not start enrollment." });
      return;
    }
    setEnrolling({
      factorId: data.id,
      qr: data.totp.qr_code,
      secret: data.totp.secret,
    });
  }

  // Drop the pending unverified factor when the user cancels enrollment.
  // Cleanup runs server-side (admin API) so no "2FA disabled" email is sent.
  async function cancelEnroll() {
    setEnrolling(null);
    setCode("");
    setMsg(null);
    await cleanupUnverifiedMfa();
  }

  async function verifyEnroll(e?: React.FormEvent) {
    e?.preventDefault();
    if (!enrolling || verifying) return;
    setVerifying(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrolling.factorId,
      code: code.trim(),
    });
    if (error) {
      setMsg({ ok: false, text: "Invalid code — scan the QR and try again." });
      setCode("");
    } else {
      setMsg({ ok: true, text: "Two-factor authentication enabled" });
      setEnrolling(null);
      setCode("");
      await load();
    }
    setVerifying(false);
  }

  async function confirmDisable(e?: React.FormEvent) {
    e?.preventDefault();
    if (!disablingId || disabling) return;
    setDisabling(true);
    setMsg(null);
    const supabase = createClient();
    // Unenrolling a verified factor requires an AAL2 session. Step up by
    // verifying a current code first, then remove the factor.
    const { error: challengeError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: disablingId,
      code: disableCode.trim(),
    });
    if (challengeError) {
      setMsg({ ok: false, text: "Invalid code — try again." });
      setDisableCode("");
      setDisabling(false);
      return;
    }
    const { error } = await supabase.auth.mfa.unenroll({ factorId: disablingId });
    if (error) {
      setMsg({ ok: false, text: error.message });
    } else {
      setMsg({ ok: true, text: "Two-factor authentication disabled." });
      setDisablingId(null);
      setDisableCode("");
      await load();
    }
    setDisabling(false);
  }

  async function resendVerification() {
    if (!user?.email) return;
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
    });
    setMsg(
      error
        ? { ok: false, text: error.message }
        : { ok: true, text: "Verification email sent." }
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const verifiedFactors = factors.filter((f) => f.status === "verified");

  return (
    <RevealGroup className="grid max-w-4xl gap-5 lg:grid-cols-2" stagger={0.07}>
      <RevealItem y={16}>
      <Card className="h-full">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <KeyRound className="h-5 w-5 text-primary-light" />
          </span>
          <div>
            <h2 className="font-bold text-white">Change password</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Use at least 8 characters with a mix of letters and numbers.
            </p>
          </div>
        </div>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label htmlFor="security-new-password" className="label">
              New password
            </label>
            <input
              id="security-new-password"
              type="password"
              className="input min-h-[44px]"
              placeholder="New password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="security-confirm-password" className="label">
              Confirm new password
            </label>
            <input
              id="security-confirm-password"
              type="password"
              className="input min-h-[44px]"
              placeholder="Confirm new password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button disabled={savingPw} className="min-h-[44px]">
            {savingPw ? "Updating…" : "Update password"}
          </Button>
        </form>

        <div className="mt-8 border-t border-edge pt-5">
          <h3 className="text-sm font-semibold text-white">Email verification</h3>
          <div className="mt-2 flex items-center justify-between">
            <Badge variant={user?.email_confirmed_at ? "success" : "warning"}>
              {user?.email_confirmed_at ? "✓ Verified" : "Not verified"}
            </Badge>
            {!user?.email_confirmed_at && (
              <Button size="sm" variant="outline" onClick={resendVerification}>
                Resend email
              </Button>
            )}
          </div>
        </div>
      </Card>
      </RevealItem>

      <RevealItem y={16}>
      <Card className="h-full">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <ShieldCheck className="h-5 w-5 text-primary-light" />
          </span>
          <div>
            <h2 className="font-bold text-white">Two-factor authentication</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Protect your account with an authenticator app (Google
              Authenticator, Authy, 1Password…).
            </p>
          </div>
        </div>

        {verifiedFactors.length > 0 && !enrolling && (
          <div className="space-y-3">
            {verifiedFactors.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-emerald-200">
                    {f.friendly_name ?? "Authenticator app"}
                  </p>
                  <p className="text-xs text-emerald-400/70">Active</p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  className="min-h-[44px]"
                  onClick={() => {
                    setDisablingId(f.id);
                    setDisableCode("");
                    setMsg(null);
                  }}
                >
                  <ShieldOff className="h-4 w-4" /> Disable
                </Button>
              </div>
            ))}
            {disablingId && (
              <form
                onSubmit={confirmDisable}
                className="space-y-3 rounded-xl border border-edge bg-raised/40 p-4"
              >
                <label
                  htmlFor="disable-2fa-code"
                  className="block text-sm text-zinc-300"
                >
                  Enter your current 6-digit authenticator code to turn off 2FA.
                </label>
                <input
                  id="disable-2fa-code"
                  className="input min-h-[48px] text-center font-mono text-lg tracking-[0.4em]"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={disableCode}
                  onChange={(e) =>
                    setDisableCode(e.target.value.replace(/\D/g, ""))
                  }
                  autoComplete="one-time-code"
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="danger"
                    className="min-h-[44px]"
                    disabled={disabling || disableCode.length !== 6}
                  >
                    {disabling ? "Disabling…" : "Confirm disable"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-[44px]"
                    onClick={() => setDisablingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {verifiedFactors.length === 0 && !enrolling && (
          <Button onClick={startEnroll} className="min-h-[44px]">
            <ShieldCheck className="h-4 w-4" /> Enable 2FA
          </Button>
        )}

        {enrolling && (
          <form onSubmit={verifyEnroll} className="space-y-4">
            <p className="text-sm text-zinc-400">
              Scan the QR code with your authenticator app, then enter the
              6-digit code it shows.
            </p>
            <div className="mx-auto w-fit rounded-2xl border border-edge bg-white p-3">
              <img
                src={enrolling.qr}
                alt="Scan this QR code with your authenticator app"
                className="mx-auto h-44 w-44"
              />
            </div>
            <div>
              <p className="mb-1.5 text-center text-xs text-zinc-500">
                Or enter this setup key manually:
              </p>
              <p className="break-all rounded-xl border border-edge bg-raised px-3 py-2 text-center font-mono text-xs text-zinc-400">
                {enrolling.secret}
              </p>
            </div>
            <div>
              <label htmlFor="enroll-2fa-code" className="sr-only">
                6-digit authentication code
              </label>
              <input
                id="enroll-2fa-code"
                className="input min-h-[48px] text-center font-mono text-xl tracking-[0.4em]"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoComplete="one-time-code"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="min-h-[44px]"
                disabled={verifying || code.length !== 6}
              >
                {verifying ? "Verifying…" : "Verify & enable"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="min-h-[44px]"
                onClick={cancelEnroll}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card>
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
