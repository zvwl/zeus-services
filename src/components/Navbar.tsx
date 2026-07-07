import { cookies } from "next/headers";
import { getCategories, getSettings, setting } from "@/lib/data";
import { getProfile, getUser, isStaff } from "@/lib/auth";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { NavClient } from "@/components/NavClient";

// Stable key for the current announcement copy, so the dismissal cookie
// invalidates itself whenever the admin changes the message.
function announcementKey(message: string) {
  let hash = 0;
  for (let i = 0; i < message.length; i++)
    hash = (hash * 31 + message.charCodeAt(i)) | 0;
  return Math.abs(hash).toString(36);
}

export async function Navbar() {
  const [categories, settings, user, profile, cookieStore] = await Promise.all([
    getCategories(),
    getSettings(),
    getUser(),
    getProfile(),
    cookies(),
  ]);

  const announcement = setting(settings, "announcement");
  const dismissKey = announcement ? announcementKey(announcement) : null;
  const dismissed =
    dismissKey !== null &&
    cookieStore.get("announcement_dismissed")?.value === dismissKey;

  return (
    <>
      {announcement && dismissKey && !dismissed && (
        <AnnouncementBar message={announcement} dismissKey={dismissKey} />
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
