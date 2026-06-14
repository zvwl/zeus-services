// Best-effort notifications to a staff Discord channel via webhook.
// Configure DISCORD_WEBHOOK_URL to enable; failures never break the request.

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export async function notifyDiscord(opts: {
  title: string;
  description?: string;
  fields?: DiscordEmbedField[];
  color?: number;
}) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: opts.title,
            description: opts.description ?? "",
            color: opts.color ?? 0x8b5cf6,
            fields: opts.fields ?? [],
            footer: { text: "Zeus Services" },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (err) {
    console.error("Discord webhook failed:", err);
  }
}

export function discordBotConfigured() {
  return Boolean(
    process.env.DISCORD_BOT_TOKEN &&
      process.env.DISCORD_GUILD_ID &&
      process.env.DISCORD_CUSTOMER_ROLE_ID
  );
}

/**
 * Grants the "customer" role to a member of the configured Discord guild.
 * Requires a bot (DISCORD_BOT_TOKEN) that is in the server with the
 * "Manage Roles" permission and whose own role sits ABOVE the role being
 * granted. Idempotent — re-granting an existing role is a no-op.
 *
 * Returns a result object; never throws into the caller.
 */
export async function assignDiscordRole(
  discordUserId: string
): Promise<{ ok: boolean; reason?: string }> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const roleId = process.env.DISCORD_CUSTOMER_ROLE_ID;
  if (!token || !guildId || !roleId) return { ok: false, reason: "not_configured" };
  if (!discordUserId) return { ok: false, reason: "no_discord_id" };

  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${token}`,
          "X-Audit-Log-Reason": "Verified customer — paid order on Zeus Services",
        },
      }
    );
    // 204 = role added (or already present)
    if (res.status === 204) return { ok: true };
    // 404 = the user isn't a member of the server yet
    if (res.status === 404) return { ok: false, reason: "not_in_guild" };
    const body = await res.text();
    console.error("Discord role assign failed:", res.status, body);
    return { ok: false, reason: `http_${res.status}` };
  } catch (err) {
    console.error("Discord role assign error:", err);
    return { ok: false, reason: "error" };
  }
}

