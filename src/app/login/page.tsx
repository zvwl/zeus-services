import type { Metadata } from "next";
import { getSettings, setting } from "@/lib/data";
import { safeNextPath } from "@/lib/utils";
import { LoginForm } from "./LoginForm";

// Auth screens are thin, session-specific pages — keep them out of the index.
export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: true },
};

// Duplicated params arrive as arrays — mirror useSearchParams().get()'s
// first-value semantics (safeNextPath would throw on an array).
const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; error?: string | string[] }>;
}) {
  const params = await searchParams;
  const settings = await getSettings();
  // Search params arrive as server props — deliberately no Suspense boundary
  // around the form. The old useSearchParams boundary streamed an empty
  // full-viewport fallback first, letting the footer paint at the top and
  // then shoving it down a whole screen (measured CLS 0.775 in lab). With no
  // boundary there is no fallback paint to guard against.
  return (
    <LoginForm
      next={safeNextPath(first(params.next))}
      urlError={Boolean(first(params.error))}
      logoUrl={setting(settings, "logo_url") || null}
    />
  );
}
