import type { Metadata } from "next";
import { getSettings, setting } from "@/lib/data";
import { SignupForm } from "./SignupForm";

// Auth screens are thin, session-specific pages — keep them out of the index.
export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: true },
};

export default async function SignupPage() {
  const settings = await getSettings();
  return <SignupForm logoUrl={setting(settings, "logo_url") || null} />;
}
