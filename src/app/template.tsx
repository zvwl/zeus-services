// Remounts on every route change, giving each page a cheap CSS-only fade-up
// entrance (no JS animation runtime on the navigation critical path).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
