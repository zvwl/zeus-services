import type { Metadata } from "next";

// The page is a client component, so its metadata lives in this layout.
// Auth screens are thin, session-specific pages — keep them out of the index.
export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: true },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
