import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, STAFF_ROLES, type Profile, type Role } from "@/lib/types";

// Ordered privilege tiers. Higher number = more access. Add new roles here
// (and to the DB check constraint) to slot them into the hierarchy.
export const ROLE_RANK: Record<Role, number> = {
  customer: 0,
  support: 1,
  admin: 2,
  super_admin: 3,
};

/** True if the profile's role is at least the given tier. */
export function roleAtLeast(profile: Profile | null, role: Role) {
  return Boolean(profile && ROLE_RANK[profile.role] >= ROLE_RANK[role]);
}

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Returns the zeus.profiles row for the signed-in user, creating one on the
 * fly for accounts that pre-date this app (the auth.users trigger only fires
 * for new signups).
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (data) return data as Profile;

  const { data: created } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      username: user.email?.split("@")[0] ?? null,
    })
    .select("*")
    .maybeSingle();
  return (created as Profile) ?? null;
});

export function isStaff(profile: Profile | null) {
  return Boolean(profile && STAFF_ROLES.includes(profile.role));
}

export function isAdmin(profile: Profile | null) {
  return Boolean(profile && ADMIN_ROLES.includes(profile.role));
}

async function requireRole(roles: Role[]) {
  const profile = await getProfile();
  if (!profile || !roles.includes(profile.role)) {
    throw new Error("Unauthorized");
  }
  return profile;
}

/** support, admin or super_admin — read-mostly staff surfaces. */
export const requireStaff = () => requireRole([...STAFF_ROLES]);
/** admin or super_admin — content & catalog management. */
export const requireAdmin = () => requireRole([...ADMIN_ROLES]);
/** super_admin only — team / role management. */
export const requireSuperAdmin = () => requireRole(["super_admin"]);

// ── Page guards (server components): redirect instead of throwing, so an
// under-privileged staff member lands back on the dashboard, not an error. ──

/** Admin-only page. Redirects support → /admin. */
export async function requireAdminPage() {
  const profile = await getProfile();
  if (!isAdmin(profile)) redirect("/admin");
  return profile as Profile;
}

/** Super-admin-only page. Redirects everyone else → /admin. */
export async function requireSuperAdminPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "super_admin") redirect("/admin");
  return profile;
}
