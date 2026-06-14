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
