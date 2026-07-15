import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode, ButtonHTMLAttributes } from "react";

const buttonVariants = {
  primary:
    "bg-primary hover:bg-primary-dark text-white shadow-glow-sm hover:shadow-glow",
  gold: "bg-gradient-to-r from-amber-200 via-gold to-amber-500 hover:from-amber-100 hover:via-amber-300 hover:to-amber-400 text-zinc-950 font-semibold shadow-glow-gold",
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

// Mount exactly once per document (root layout). Never use the <use>-based
// icons inside Satori opengraph-image routes — Satori doesn't resolve <use>.
// Zero-size + absolute rather than display:none: legacy WebKit ignores
// <symbol> defined inside display:none subtrees.
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="i-star" viewBox="0 0 20 20">
        <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.18 3.62a1 1 0 0 0 .95.7h3.8c.97 0 1.37 1.24.59 1.8l-3.08 2.25a1 1 0 0 0-.36 1.12l1.17 3.62c.3.92-.75 1.69-1.54 1.12l-3.07-2.24a1 1 0 0 0-1.18 0l-3.07 2.24c-.79.57-1.84-.2-1.54-1.12l1.17-3.62a1 1 0 0 0-.36-1.12L2.53 9.05c-.78-.56-.38-1.8.6-1.8h3.79a1 1 0 0 0 .95-.69l1.18-3.63Z" />
      </symbol>
      <symbol id="i-discord" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </symbol>
    </svg>
  );
}

export function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <use href="#i-star" />
    </svg>
  );
}

export function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <use href="#i-discord" />
    </svg>
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
        <StarIcon
          key={i}
          className={cn(
            "h-4 w-4",
            i <= Math.round(rating) ? "text-amber-400" : "text-zinc-700"
          )}
        />
      ))}
    </span>
  );
}
