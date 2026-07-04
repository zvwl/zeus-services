import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode, ButtonHTMLAttributes } from "react";

const buttonVariants = {
  primary:
    "bg-primary hover:bg-primary-dark text-white shadow-glow-sm hover:shadow-glow",
  gold: "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold shadow-glow-gold",
  outline:
    "border border-edge bg-raised/50 hover:bg-raised hover:border-primary/50 text-zinc-200",
  ghost: "hover:bg-raised text-zinc-300 hover:text-white",
  danger: "bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25",
  success:
    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25",
} as const;

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
} as const;

type ButtonVariant = keyof typeof buttonVariants;
type ButtonSize = keyof typeof buttonSizes;

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("glass p-6", className)}>{children}</div>;
}

const badgeVariants = {
  default: "bg-raised text-zinc-300 border-edge",
  primary: "bg-primary/15 text-primary-light border-primary/30",
  gold: "bg-amber-400/10 text-amber-300 border-amber-400/30",
  success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  danger: "bg-red-500/10 text-red-300 border-red-500/30",
  info: "bg-sky-500/10 text-sky-300 border-sky-500/30",
} as const;

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: keyof typeof badgeVariants;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusBadgeVariant(
  status: string
): keyof typeof badgeVariants {
  switch (status) {
    case "completed":
    case "paid":
    case "answered":
      return "success";
    case "processing":
    case "open":
      return "info";
    case "pending":
      return "warning";
    case "cancelled":
    case "refunded":
    case "closed":
      return "danger";
    default:
      return "default";
  }
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5 animate-spin text-primary", className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-zinc-600">{icon}</div>}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && (
        <p className="max-w-md text-sm text-zinc-500">{description}</p>
      )}
      {action}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string | null;
  center?: boolean;
  // Use `as="h1"` when this heading is the page's main title, so each page has
  // exactly one h1 for SEO/accessibility. Defaults to h2 for section headings.
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("mb-10", center && "text-center")}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-light">
          {eyebrow}
        </p>
      )}
      <Heading className="text-3xl font-bold text-white sm:text-4xl">{title}</Heading>
      {subtitle && (
        <p
          className={cn(
            "mt-3 max-w-2xl text-zinc-400",
            center && "mx-auto"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Stars({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={cn(
            "h-4 w-4",
            i <= Math.round(rating) ? "text-amber-400" : "text-zinc-700"
          )}
          fill="currentColor"
        >
          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.18 3.62a1 1 0 0 0 .95.7h3.8c.97 0 1.37 1.24.59 1.8l-3.08 2.25a1 1 0 0 0-.36 1.12l1.17 3.62c.3.92-.75 1.69-1.54 1.12l-3.07-2.24a1 1 0 0 0-1.18 0l-3.07 2.24c-.79.57-1.84-.2-1.54-1.12l1.17-3.62a1 1 0 0 0-.36-1.12L2.53 9.05c-.78-.56-.38-1.8.6-1.8h3.79a1 1 0 0 0 .95-.69l1.18-3.63Z" />
        </svg>
      ))}
    </span>
  );
}
