import type { Metadata } from "next";

// The page is a client component, so its metadata lives in this layout.
// Auth screens are thin, session-specific pages — keep them out of the index.
export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: true },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
