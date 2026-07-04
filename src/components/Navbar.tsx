import { getCategories, getSettings, setting } from "@/lib/data";
import { NavClient } from "@/components/NavClient";

// Reads only cached, cookie-free data (getSettings/getCategories), so it does
// NOT force the shared layout to render dynamically. The signed-in user is
// resolved on the client inside NavClient.
export async function Navbar() {
  const [categories, settings] = await Promise.all([
    getCategories(),
    getSettings(),
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
      />
    </>
  );
}
