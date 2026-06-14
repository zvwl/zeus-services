import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Badge, Card } from "@/components/ui";
import { ActionSelect } from "@/components/admin/ActionControls";
import { setUserRole } from "@/app/admin/actions";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export const revalidate = 0;

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const me = await getProfile();
  if (!me || me.role !== "super_admin") redirect("/admin");

  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createClient();

  const { data: staff } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["support", "admin", "super_admin"])
    .order("created_at");

  let searched: Profile[] = [];
  if (query) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .or(`email.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(10);
    searched = (data as Profile[]) ?? [];
  }

  const roleOptions = [
    { value: "customer", label: "customer" },
    { value: "support", label: "support" },
    { value: "admin", label: "admin" },
    { value: "super_admin", label: "super admin" },
  ];

  function Row({ p }: { p: Profile }) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-edge bg-raised/40 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{p.username ?? "—"}</p>
          <p className="truncate text-xs text-zinc-500">
            {p.email} · joined {formatDate(p.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={p.role === "customer" ? "default" : "gold"}>
            {p.role.replace("_", " ")}
          </Badge>
          {p.id === me!.id ? (
            <span className="text-xs text-zinc-600">(you)</span>
          ) : (
            <ActionSelect
              action={setUserRole}
              fields={{ user_id: p.id }}
              name="role"
              value={p.role}
              options={roleOptions}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold text-white">
        <ShieldCheck className="h-6 w-6 text-gold" /> Team & roles
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Super-admin only. Roles: <strong className="text-zinc-300">support</strong>{" "}
        (orders & tickets), <strong className="text-zinc-300">admin</strong> (full
        store management), <strong className="text-zinc-300">super admin</strong>{" "}
        (everything + this page). Role changes are protected at the database
        level — only super admins can perform them.
      </p>

      <Card className="mt-6">
        <h2 className="mb-4 font-bold text-white">Current team</h2>
        <div className="space-y-2.5">
          {((staff as Profile[]) ?? []).map((p) => (
            <Row key={p.id} p={p} />
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="mb-1 font-bold text-white">Promote a user</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Search any registered user by email or username, then assign a role.
          The user must have signed up first.
        </p>
        <form action="/admin/team">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="user@example.com"
            className="input"
          />
        </form>
        {query && (
          <div className="mt-4 space-y-2.5">
            {searched.length === 0 ? (
              <p className="text-sm text-zinc-500">No users match “{query}”.</p>
            ) : (
              searched.map((p) => <Row key={p.id} p={p} />)
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
