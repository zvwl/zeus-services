"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { setUserCapabilities } from "@/app/admin/actions";
import {
  CAPABILITIES,
  CAPABILITIES_DEFAULT,
  ROLE_DEFAULT_CAPABILITIES,
  type Capability,
  type Role,
} from "@/lib/types";

// manage_team controls roles/permissions themselves — super-admin only, never
// grantable here.
const GRANTABLE = CAPABILITIES.filter((c) => c.key !== "manage_team");

export function StaffPermissions({
  userId,
  role,
  capabilities,
}: {
  userId: string;
  role: Role;
  capabilities: Capability[] | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const defaults = useMemo<Capability[]>(
    () => ROLE_DEFAULT_CAPABILITIES[role].filter((c) => c !== "manage_team"),
    [role]
  );
  const usingDefault = capabilities === null;
  const [custom, setCustom] = useState(!usingDefault);
  const [selected, setSelected] = useState<Set<Capability>>(
    () =>
      new Set<Capability>(
        (capabilities ?? defaults).filter((c) => c !== "manage_team")
      )
  );

  function toggle(key: Capability) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function save() {
    setMsg(null);
    const fd = new FormData();
    fd.set("user_id", userId);
    fd.set(
      "capabilities",
      custom ? [...selected].join(",") : CAPABILITIES_DEFAULT
    );
    startTransition(async () => {
      const res = await setUserCapabilities(fd);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh();
    });
  }

  const checkedFor = (key: Capability) =>
    custom ? selected.has(key) : defaults.includes(key);

  return (
    <div className="mt-2 w-full border-t border-edge pt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-primary-light"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        Permissions
        <span className="ml-1 text-[10px] uppercase tracking-wider text-zinc-600">
          {usingDefault ? `${role} default` : "custom"}
        </span>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-edge bg-raised/40 p-3">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={custom}
              onChange={(e) => {
                setCustom(e.target.checked);
                if (!e.target.checked) setSelected(new Set(defaults));
              }}
              className="h-4 w-4 accent-violet-500"
            />
            Customise — off uses the <strong>{role}</strong> defaults
          </label>

          <div
            className={`mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2 ${
              custom ? "" : "pointer-events-none opacity-50"
            }`}
          >
            {GRANTABLE.map((c) => (
              <label
                key={c.key}
                className="flex items-center gap-2 text-sm text-zinc-300"
              >
                <input
                  type="checkbox"
                  checked={checkedFor(c.key)}
                  onChange={() => toggle(c.key)}
                  disabled={!custom}
                  className="h-4 w-4 accent-violet-500"
                />
                {c.label}
              </label>
            ))}
          </div>

          {msg && (
            <p
              className={`mt-3 text-xs ${
                msg.ok ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {msg.text}
            </p>
          )}

          <button
            onClick={save}
            disabled={pending}
            className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-dark disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save permissions"}
          </button>
        </div>
      )}
    </div>
  );
}
