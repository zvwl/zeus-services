import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const DISCORD_GUILD_ID = Deno.env.get("DISCORD_GUILD_ID");
const DISCORD_ROLE_ID = Deno.env.get("DISCORD_ROLE_ID");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars");
}
if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_ROLE_ID) {
  console.error("Missing Discord env vars: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_ROLE_ID");
}

const supabase = createClient(
  SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Assigns a Discord role to a user via Discord API
 * @param discordUserId The Discord user's ID (not the Supabase user ID)
 * @returns Boolean indicating success
 */
async function assignDiscordRole(discordUserId: string): Promise<boolean> {
  try {
    // Discord API endpoint to add role to guild member
    const url = `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${DISCORD_ROLE_ID}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Audit-Log-Reason': 'Customer purchased from website'
      }
    });

    if (response.status === 204) {
      console.log(`✅ Successfully assigned role ${DISCORD_ROLE_ID} to Discord user ${discordUserId}`);
      return true;
    } else if (response.status === 404) {
      console.error(`❌ Discord user ${discordUserId} not found in server (they may have left)`);
      return false;
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed to assign Discord role: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error assigning Discord role:`, error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { userId, orderId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🎯 Processing Discord role assignment for user ${userId}, order ${orderId || 'N/A'}`);

    // Get Discord ID from auth.identities via our helper function
    const { data: discordIdData, error: discordIdError } = await supabase.rpc(
      'get_discord_id',
      { p_user_id: userId }
    );

    if (discordIdError) {
      console.error(`❌ Error fetching Discord ID:`, discordIdError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Discord ID" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!discordIdData) {
      console.log(`ℹ️ User ${userId} has not connected Discord account - skipping role assignment`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "User has not connected Discord account" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🎮 Found Discord ID: ${discordIdData} for user ${userId}`);

    // Assign the Discord role
    const roleAssigned = await assignDiscordRole(discordIdData);

    if (roleAssigned) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Discord role assigned successfully",
          discordUserId: discordIdData
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to assign Discord role (check bot permissions and user membership)" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("❌ Error in assign-discord-role function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
