"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { inviteUser } from "@/app/admin/actions";
import { Button } from "@/components/ui";

export function InviteForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const res = await inviteUser(formData);
          setMsg({ ok: res.ok, text: res.message });
          if (res.ok) {
            setEmail("");
            router.refresh();
          }
        })
      }
      className="space-y-3"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="newteammate@example.com"
          className="input"
        />
        <Button disabled={pending} className="shrink-0">
          <Mail className="h-4 w-4" /> {pending ? "Sending…" : "Send invite"}
        </Button>
      </div>
      {msg && (
        <p
          className={`rounded-xl border px-3 py-2 text-sm ${
            msg.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {msg.text}
        </p>
      )}
    </form>
  );
}
