// Best-effort notifications to a staff Discord channel via webhook.
// Configure DISCORD_WEBHOOK_URL to enable; failures never break the request.

import { createAdminClient } from "@/lib/supabase/admin";

// Orders that count as a completed purchase for role eligibility.
const QUALIFYING_ORDER_STATUSES = ["paid", "processing", "completed"];

// Discord roles granted by lifetime spend (USD). Roles are additive, so a big
// spender receives every tier they qualify for. A tier is skipped when its env
// var isn't set, so the VIP role is optional. Adjust thresholds here.
const DISCORD_ROLE_TIERS: { minSpendUsd: number; env: string; label: string }[] = [
  { minSpendUsd: 3, env: "DISCORD_CUSTOMER_ROLE_ID", label: "customer" },
  { minSpendUsd: 20, env: "DISCORD_VIP_ROLE_ID", label: "vip" },
];

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
  discordUserId: string,
  roleId: string
): Promise<{ ok: boolean; reason?: string; detail?: string }> {
  // Trim to defend against trailing spaces/newlines pasted into env vars —
  // those make the URL or Authorization header invalid and fetch throws.
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  const role = roleId?.trim();
  if (!token || !guildId || !role) return { ok: false, reason: "not_configured" };
  const userId = discordUserId.trim();
  if (!userId) return { ok: false, reason: "no_discord_id" };

  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${role}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${token}`,
          "X-Audit-Log-Reason": "Verified customer - paid order on Zeus Services",
        },
      }
    );
    // 204 = role added (or already present)
    if (res.status === 204) return { ok: true };
    // 404 = the user isn't a member of the server yet
    if (res.status === 404) return { ok: false, reason: "not_in_guild" };
    const body = await res.text();
    console.error("Discord role assign failed:", res.status, body);
    return { ok: false, reason: `http_${res.status}`, detail: body.slice(0, 300) };
  } catch (err) {
    console.error("Discord role assign error:", err);
    return {
      ok: false,
      reason: "error",
      detail: err instanceof Error ? err.message : String(err),
    };
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
    const meta = identity?.identity_data ?? {};
    const discordId =
      identity?.id ||
      (meta.provider_id as string | undefined) ||
      (meta.sub as string | undefined) ||
      null;
    const discordUsername =
      (meta.global_name as string | undefined) ||
      (meta.full_name as string | undefined) ||
      (meta.user_name as string | undefined) ||
      (meta.name as string | undefined) ||
      null;
    if (discordId) {
      await db
        .from("profiles")
        .update({
          discord_id: discordId,
          ...(discordUsername ? { discord_username: discordUsername } : {}),
        })
        .eq("id", userId);
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

    // Lifetime spend (USD) across paid orders decides which role tiers apply.
    const { data: paidOrders } = await db
      .from("orders")
      .select("subtotal_usd")
      .eq("user_id", userId)
      .in("status", QUALIFYING_ORDER_STATUSES);
    const totalSpend = (paidOrders ?? []).reduce(
      (sum, o) => sum + Number(o.subtotal_usd ?? 0),
      0
    );
    if (totalSpend <= 0) return { ok: false, reason: "no_paid_order" };

    const discordId = await resolveDiscordId(db, userId);
    if (!discordId) return { ok: false, reason: "no_discord_id" };

    // Assign every tier the customer qualifies for (Discord roles are additive).
    const roles: Record<string, string> = {};
    let anyGranted = false;
    for (const tier of DISCORD_ROLE_TIERS) {
      const roleId = process.env[tier.env]?.trim();
      if (!roleId || totalSpend < tier.minSpendUsd) continue;
      const r = await assignDiscordRole(discordId, roleId);
      roles[tier.label] = r.ok
        ? "granted"
        : `${r.reason ?? "skipped"}${r.detail ? ` (${r.detail})` : ""}`;
      if (r.ok) anyGranted = true;
    }

    await db.from("audit_logs").insert({
      actor_id: null,
      action: anyGranted ? "discord.role_granted" : "discord.role_skipped",
      entity: "profile",
      entity_id: userId,
      meta: {
        discord_id: discordId,
        spend_usd: Math.round(totalSpend * 100) / 100,
        roles,
        ...opts.meta,
      },
    });
    return { ok: anyGranted, reason: anyGranted ? undefined : "no_role_assigned" };
  } catch (err) {
    console.error("syncCustomerDiscordRole error:", err);
    return { ok: false, reason: "error" };
  }
}

