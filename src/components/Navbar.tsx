import { getCategories, getSettings, setting } from "@/lib/data";
import { getProfile, getUser, isStaff } from "@/lib/auth";
import { NavClient } from "@/components/NavClient";

export async function Navbar() {
  const [categories, settings, user, profile] = await Promise.all([
    getCategories(),
    getSettings(),
    getUser(),
    getProfile(),
  ]);

  const announcement = setting(settings, "announcement");

  return (
    <>
      {announcement && (
        <div className="bg-gradient-to-r from-primary-dark via-primary to-fuchsia-600 px-4 py-2 text-center text-xs font-medium text-white">
          {announcement}
        </div>
      )}
      <NavClient
        siteName={setting(settings, "site_name", "Zeuservices")}
        logoUrl={setting(settings, "logo_url") || undefined}
        categories={categories.map((c) => ({ name: c.name, slug: c.slug }))}
        discordInvite={setting(settings, "discord_invite")}
        user={
          user
            ? {
                email: user.email ?? "",
                username: profile?.username ?? null,
                avatarUrl: profile?.avatar_url ?? null,
                staff: isStaff(profile),
              }
            : null
        }
      />
    </>
  );
}
