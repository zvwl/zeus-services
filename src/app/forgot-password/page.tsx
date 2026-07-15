import type { Metadata } from "next";
import { getSettings, setting } from "@/lib/data";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

// Auth screens are thin, session-specific pages — keep them out of the index.
export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: true },
};

export default async function ForgotPasswordPage() {
  const settings = await getSettings();
  return <ForgotPasswordForm logoUrl={setting(settings, "logo_url") || null} />;
}
