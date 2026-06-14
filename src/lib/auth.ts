import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, STAFF_ROLES, type Profile, type Role } from "@/lib/types";

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
