"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import type { AdminResult } from "@/app/admin/actions";

type ServerAction = (formData: FormData) => Promise<AdminResult>;

/** Small button that invokes a server action with fixed fields. */
export function ActionButton({
  action,
  fields,
  children,
  variant = "outline",
  size = "sm",
  confirmText,
  className,
}: {
  action: ServerAction;
  fields: Record<string, string>;
  children: ReactNode;
  variant?: "primary" | "gold" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  confirmText?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        const formData = new FormData();
        for (const [k, v] of Object.entries(fields)) formData.set(k, v);
        startTransition(async () => {
          const res = await action(formData);
          if (!res.ok) window.alert(res.message);
          router.refresh();
        });
      }}
    >
      {pending ? "…" : children}
    </Button>
  );
}

/** Select that submits a server action on change (e.g. order status). */
export function ActionSelect({
  action,
  fields,
  name,
  value,
  options,
  className,
}: {
  action: ServerAction;
  fields: Record<string, string>;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(value);

  return (
    <select
      className={`input w-auto py-1.5 text-xs ${className ?? ""}`}
      value={current}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        setCurrent(next);
        const formData = new FormData();
        for (const [k, v] of Object.entries(fields)) formData.set(k, v);
        formData.set(name, next);
        startTransition(async () => {
          const res = await action(formData);
          if (!res.ok) {
            window.alert(res.message);
            setCurrent(value);
          }
          router.refresh();
        });
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
