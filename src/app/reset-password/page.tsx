import type { Metadata } from "next";
import { getSettings, setting } from "@/lib/data";
import { ResetPasswordForm } from "./ResetPasswordForm";

// Auth screens are thin, session-specific pages — keep them out of the index.
export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: true },
};

// The recovery `code` param is consumed by /auth/callback before the user
// lands here with a session — this page itself reads no search params.
export default async function ResetPasswordPage() {
  const settings = await getSettings();
  return <ResetPasswordForm logoUrl={setting(settings, "logo_url") || null} />;
}
