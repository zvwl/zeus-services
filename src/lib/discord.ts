// Best-effort notifications to a staff Discord channel via webhook.
// Configure DISCORD_WEBHOOK_URL to enable; failures never break the request.

import { createAdminClient } from "@/lib/supabase/admin";

// Orders that count as a completed purchase for role eligibility.
const QUALIFYING_ORDER_STATUSES = ["paid", "processing", "completed"];

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

/**
 * Resolves a user's Discord ID: prefers the cached profiles.discord_id,
 * otherwise reads it from the user's linked Discord identity and backfills
 * it for next time. Returns null if they've never connected Discord.
 */
export async function resolveDiscordId(
  db: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string | null> {
  const { data: profile } = await db
    .from("profiles")
    .select("discord_id")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.discord_id) return profile.discord_id;

  try {
    const { data } = await db.auth.admin.getUserById(userId);
    const identity = data.user?.identities?.find((i) => i.provider === "discord");
    const discordId =
      identity?.id ||
      (identity?.identity_data?.provider_id as string | undefined) ||
      (identity?.identity_data?.sub as string | undefined) ||
      null;
    if (discordId) {
      await db.from("profiles").update({ discord_id: discordId }).eq("id", userId);
    }
    return discordId;
  } catch {
    return null;
  }
}

/**
 * Grants the verified-customer Discord role when the user has BOTH a connected
 * Discord account AND at least one paid order — regardless of which happened
 * first. Run this both at purchase time and whenever the user connects Discord
 * later, so "buy then connect" and "connect then buy" behave identically.
 *
 * Idempotent (re-granting an existing role is a Discord no-op) and best effort:
 * it never throws into the caller.
 */
export async function syncCustomerDiscordRole(
  userId: string | null | undefined,
  opts: {
    db?: ReturnType<typeof createAdminClient>;
    meta?: Record<string, unknown>;
  } = {}
): Promise<{ ok: boolean; reason?: string }> {
  if (!userId) return { ok: false, reason: "no_user" };
  if (!discordBotConfigured()) return { ok: false, reason: "not_configured" };

  try {
    const db = opts.db ?? createAdminClient();

    // Only verified buyers get the role.
    const { count } = await db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", QUALIFYING_ORDER_STATUSES);
    if (!count) return { ok: false, reason: "no_paid_order" };

    const discordId = await resolveDiscordId(db, userId);
    if (!discordId) return { ok: false, reason: "no_discord_id" };

    const result = await assignDiscordRole(discordId);
    await db.from("audit_logs").insert({
      actor_id: null,
      action: result.ok ? "discord.role_granted" : "discord.role_skipped",
      entity: "profile",
      entity_id: userId,
      meta: { discord_id: discordId, reason: result.reason ?? null, ...opts.meta },
    });
    return result;
  } catch (err) {
    console.error("syncCustomerDiscordRole error:", err);
    return { ok: false, reason: "error" };
  }
}

