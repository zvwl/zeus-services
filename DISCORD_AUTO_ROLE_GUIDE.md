# Discord Auto-Role for Customers - Complete Setup Guide

Automatically assign a Discord role to users when they purchase something from your website after connecting their Discord account via Supabase OAuth.

---

## Overview

**What This Does:**
1. Users connect their Discord account to your website (like they do with Google)
2. When they purchase something, they automatically get a "Customer" role on your Discord server
3. This happens instantly after payment is confirmed via Stripe webhook

**Tech Stack:**
- Supabase OAuth (Discord provider)
- Discord Bot API (for role assignment)
- Supabase Edge Function (triggers on order creation)

---

## Step 1: Create Discord Application & Bot

### 1.1 Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Name it (e.g., "Zeus Services Bot")
4. Click **"Create"**

### 1.2 Get OAuth2 Credentials (for Supabase)
1. In your application, go to **OAuth2** → **General**
2. Copy your **Client ID** (you'll need this for Supabase)
3. Copy your **Client Secret** (you'll need this for Supabase)
4. Click **"Add Redirect"** and add:
   ```
   https://<your-supabase-project-id>.supabase.co/auth/v1/callback
   ```
   Replace `<your-supabase-project-id>` with your actual Supabase project reference ID
   (Example: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`)

### 1.3 Create Bot User
1. Go to **Bot** section (left sidebar)
2. Click **"Add Bot"** → **"Yes, do it!"**
3. Under **Token**, click **"Reset Token"** → **"Copy"**
   - **SAVE THIS TOKEN SECURELY** - you'll need it for the Edge Function
   - This is your `DISCORD_BOT_TOKEN`
4. Under **Privileged Gateway Intents**:
   - ✅ Enable **"Server Members Intent"** (needed to manage roles)
5. Click **"Save Changes"**

### 1.4 Invite Bot to Your Server
1. Go to **OAuth2** → **URL Generator**
2. Under **Scopes**, select:
   - ✅ `bot`
3. Under **Bot Permissions**, select:
   - ✅ **Manage Roles** (needed to assign roles to users)
4. Copy the **Generated URL** at the bottom
5. Open the URL in a new tab and invite the bot to your Discord server

---

## Step 2: Create Discord Role

1. Open your Discord server
2. Go to **Server Settings** → **Roles**
3. Click **"Create Role"**
4. Name it (e.g., "Customer")
5. Set any permissions/color you want
6. **IMPORTANT**: Make sure the bot's role is **higher** in the role hierarchy than the "Customer" role
   - Drag the bot's role above the Customer role in the role list
7. Right-click the "Customer" role → **Copy Role ID**
   - **SAVE THIS** - this is your `DISCORD_ROLE_ID`

**To enable "Copy Role ID":**
- Go to **User Settings** → **Advanced** → Enable **Developer Mode**

---

## Step 3: Setup Discord OAuth in Supabase

### 3.1 Enable Discord Provider
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Discord** and click to enable it
5. Enter your **Client ID** (from Step 1.2)
6. Enter your **Client Secret** (from Step 1.2)
7. Click **"Save"**

### 3.2 Update Redirect URL
The redirect URL should already be correct, but verify it matches:
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

---

## Step 4: Add Discord Login to Frontend

### 4.1 Update AuthContext.jsx

Add a Discord login function similar to Google:

```jsx
// In src/contexts/AuthContext.jsx
// Add after loginWithGoogle function (around line 400)

const loginWithDiscord = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: import.meta.env.VITE_FRONTEND_URL || window.location.origin,
        scopes: 'identify email' // Basic Discord scopes
      }
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, url: data?.url }
  } catch (err) {
    return { success: false, error: 'Could not start Discord sign-in' }
  }
}

// Add to the return statement (around line 578)
// Add loginWithDiscord to the exported context:
return (
  <AuthContext.Provider
    value={{
      // ...existing values...
      loginWithGoogle,
      loginWithDiscord, // ADD THIS
      // ...rest of values...
    }}
  >
```

### 4.2 Add Discord Button to LoginPage.jsx

```jsx
// In src/pages/LoginPage.jsx
// Import Discord logo (you'll need to add this asset)
import discordLogo from '../assets/discord-logo.svg'

// Get loginWithDiscord from useAuth (around line 27)
const { login, loginWithGoogle, loginWithDiscord, verifyMfaChallenge } = useAuth()

// Add Discord login handler (after handleGoogleLogin around line 110)
const handleDiscordLogin = async (e) => {
  e.preventDefault()
  setError('')
  const result = await loginWithDiscord()
  if (!result.success) {
    setError(result.error)
  }
}

// Add Discord button in JSX (after Google button around line 250)
<button 
  type="button" 
  className="google-btn"
  onClick={handleDiscordLogin}
  disabled={!siteKey}
>
  <img src={discordLogo} alt="Discord" />
  <span>Continue with Discord</span>
</button>
```

**Note**: You'll need to add a Discord logo SVG to `src/assets/discord-logo.svg`

---

## Step 5: Store Discord User ID

When users connect with Discord, Supabase automatically stores their Discord user ID in the `auth.identities` table. We need to be able to retrieve it.

### 5.1 Create Helper Function in Database

Run this SQL migration in Supabase:

```sql
-- File: supabase/migrations/20260205_discord_helper.sql
-- Helper function to get Discord user ID from auth identities
CREATE OR REPLACE FUNCTION public.get_discord_id(p_user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT identity_data->>'provider_id'
    FROM auth.identities
    WHERE user_id = p_user_id
    AND provider = 'discord'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Apply this migration:
```powershell
# If using Supabase CLI
supabase db push

# Or paste it directly in Supabase Dashboard -> SQL Editor
```

---

## Step 6: Create Discord Role Assignment Edge Function

### 6.1 Create the Edge Function

Create a new file: `supabase/functions/assign-discord-role/index.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
const DISCORD_GUILD_ID = Deno.env.get("DISCORD_GUILD_ID");
const DISCORD_ROLE_ID = Deno.env.get("DISCORD_ROLE_ID");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars");
}
if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID || !DISCORD_ROLE_ID) {
  console.error("Missing Discord env vars");
}

const supabase = createClient(
  SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function assignDiscordRole(discordUserId: string): Promise<boolean> {
  try {
    const url = `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${DISCORD_ROLE_ID}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 204) {
      console.log(`✅ Successfully assigned role to Discord user ${discordUserId}`);
      return true;
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
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { userId, orderId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🎯 Processing Discord role assignment for user ${userId}, order ${orderId}`);

    // Get Discord ID from auth.identities
    const { data: discordIdData, error: discordIdError } = await supabase.rpc(
      'get_discord_id',
      { p_user_id: userId }
    );

    if (discordIdError) {
      console.error(`❌ Error fetching Discord ID:`, discordIdError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Discord ID" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!discordIdData) {
      console.log(`ℹ️ User ${userId} has not connected Discord account`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "User has not connected Discord account" 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Assign the Discord role
    const roleAssigned = await assignDiscordRole(discordIdData);

    if (roleAssigned) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Discord role assigned successfully" 
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Failed to assign Discord role" 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("❌ Error in assign-discord-role function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

### 6.2 Deploy the Edge Function

```powershell
# Navigate to your project
cd c:\dev\Zeuservices

# Deploy the function
supabase functions deploy assign-discord-role
```

### 6.3 Set Environment Variables

In Supabase Dashboard → **Edge Functions** → **assign-discord-role** → **Settings**:

Add these secrets:
- `DISCORD_BOT_TOKEN` = Your bot token from Step 1.3
- `DISCORD_GUILD_ID` = Your Discord server ID (right-click server → Copy Server ID)
- `DISCORD_ROLE_ID` = Your "Customer" role ID from Step 2

Or set them via CLI:
```powershell
supabase secrets set DISCORD_BOT_TOKEN=your_bot_token_here
supabase secrets set DISCORD_GUILD_ID=your_server_id_here
supabase secrets set DISCORD_ROLE_ID=your_role_id_here
```

---

## Step 7: Trigger Role Assignment on Purchase

### 7.1 Update stripe-webhook Edge Function

Modify `supabase/functions/stripe-webhook/index.ts` to call the Discord role assignment function after creating the order.

Find the section after the order is created (around line 178-220 where order confirmation email is sent).

Add this code after the email confirmation block:

```typescript
// In stripe-webhook/index.ts
// After the email confirmation block (around line 220)

// Assign Discord role if user has connected Discord
if (userId) {
  try {
    console.log(`🎮 Attempting to assign Discord role for user ${userId}`);
    const discordRoleUrl = `${SUPABASE_URL}/functions/v1/assign-discord-role`;
    const discordRes = await fetch(discordRoleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ 
        userId: userId,
        orderId: newOrder.id 
      })
    });
    
    const discordText = await discordRes.text();
    console.log(`🎮 Discord role response: status=${discordRes.status}, body=${discordText}`);
    
    if (!discordRes.ok) {
      console.error(`❌ Failed to assign Discord role for user ${userId}`);
    }
  } catch (discordErr) {
    console.error('❌ Discord role assignment error:', discordErr);
  }
}
```

### 7.2 Redeploy stripe-webhook

```powershell
supabase functions deploy stripe-webhook
```

---

## Step 8: Testing

### 8.1 Test Discord Login
1. Go to your website login page
2. Click "Continue with Discord"
3. Authorize the application
4. Verify you're logged in

### 8.2 Test Role Assignment
1. Make a test purchase (use Stripe test mode)
2. After payment completes, check:
   - Discord server - user should have the "Customer" role
   - Supabase logs (Dashboard → Edge Functions → stripe-webhook → Logs)
   - Look for "Discord role assigned successfully" message

### 8.3 Test Without Discord Connected
1. Create account with email/password (no Discord)
2. Make a purchase
3. Verify order completes normally (no Discord role assigned, but no errors)

---

## Troubleshooting

### User doesn't get role after purchase

**Check Discord bot permissions:**
```
1. Discord Server Settings → Roles
2. Find your bot's role
3. Make sure it has "Manage Roles" permission
4. Make sure bot's role is ABOVE the "Customer" role in hierarchy
```

**Check Supabase logs:**
```
Dashboard → Edge Functions → stripe-webhook → Logs
Look for Discord-related error messages
```

**Check Discord user ID is stored:**
```sql
-- Run in Supabase SQL Editor
SELECT 
  u.id,
  u.email,
  i.provider,
  i.identity_data->>'provider_id' as discord_id
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id
WHERE u.email = 'test@example.com';
```

### Bot can't assign role (403 Forbidden)

**Cause**: Bot doesn't have permission or role hierarchy is wrong

**Fix**:
1. Verify bot has "Manage Roles" permission
2. Verify bot's role is higher than "Customer" role
3. Re-invite bot with correct permissions (Step 1.4)

### Discord login redirects but user not logged in

**Check Supabase redirect URL:**
```
Dashboard → Authentication → URL Configuration
Site URL: https://zeuservices.com
Redirect URLs: https://zeuservices.com/**
```

---

## Optional: Add Discord Avatar to Profile

Users who log in with Discord will have their Discord avatar automatically stored. You can display it:

```jsx
// In your profile component
const { user } = useAuth()
const discordAvatar = user?.user_metadata?.avatar_url

{discordAvatar && (
  <img src={discordAvatar} alt="Profile" />
)}
```

---

## Optional: Show "Connect Discord" for Existing Users

Add a settings page where users can connect Discord even if they originally signed up with email:

```jsx
// In a settings page
const { user } = useAuth()
const [hasDiscord, setHasDiscord] = useState(false)

useEffect(() => {
  const checkDiscord = async () => {
    const { data } = await supabase.rpc('get_discord_id', { 
      p_user_id: user.id 
    })
    setHasDiscord(!!data)
  }
  checkDiscord()
}, [user])

const connectDiscord = async () => {
  await supabase.auth.linkIdentity({ provider: 'discord' })
}

return (
  <div>
    {hasDiscord ? (
      <p>✅ Discord connected</p>
    ) : (
      <button onClick={connectDiscord}>
        Connect Discord Account
      </button>
    )}
  </div>
)
```

---

## Security Notes

✅ **Bot token**: NEVER commit to Git - use Supabase secrets only
✅ **Role hierarchy**: Bot role must be above customer role
✅ **RPC function**: `get_discord_id` uses SECURITY DEFINER to safely access auth.identities
✅ **Edge function**: Only accessible with valid API key
✅ **OAuth scopes**: Only requests `identify` and `email` - no unnecessary permissions

---

## Summary

**What happens when a user purchases:**

1. User already connected Discord → Stored in `auth.identities`
2. User completes Stripe checkout
3. `stripe-webhook` creates order in database
4. `stripe-webhook` calls `assign-discord-role` Edge Function
5. `assign-discord-role` fetches Discord user ID from database
6. Discord API call assigns "Customer" role
7. User instantly has role on Discord server ✅

**If user hasn't connected Discord**: Purchase completes normally, just no role assigned (graceful fallback).

---

## Need Help?

**Check logs:**
- Supabase Dashboard → Edge Functions → Logs
- Discord Developer Portal → Bot → Logs

**Common issues:**
- Role hierarchy (bot must be above customer role)
- Missing bot permissions (Manage Roles)
- Wrong environment variables (DISCORD_GUILD_ID, DISCORD_ROLE_ID, DISCORD_BOT_TOKEN)
- User hasn't connected Discord (check auth.identities table)
