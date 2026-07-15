import type { Metadata } from "next";
import { getSettings, setting } from "@/lib/data";
import { safeNextPath } from "@/lib/utils";
import { VerifyForm } from "./VerifyForm";

// Auth screens are thin, session-specific pages — keep them out of the index.
export const metadata: Metadata = {
  title: "Two-factor verification",
  robots: { index: false, follow: true },
};

// Duplicated params arrive as arrays — mirror useSearchParams().get()'s
// first-value semantics (safeNextPath would throw on an array).
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function Verify2FAPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const settings = await getSettings();
  // `next` arrives as a server prop — deliberately no Suspense boundary (the
  // old useSearchParams boundary's empty fallback caused the same
  // footer-shove CLS footgun as /login: measured 0.775 in lab).
  return (
    <VerifyForm
      next={safeNextPath(first(params.next))}
      logoUrl={setting(settings, "logo_url") || null}
    />
  );
}
