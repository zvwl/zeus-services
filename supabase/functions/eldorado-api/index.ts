import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ENC_KEY = Deno.env.get("NOTES_ENC_KEY") ?? "";

const ELDORADO_HOST = "https://www.eldorado.gg";
const COGNITO_CLIENT_ID = "1956req5ro9drdtbf5i6kis4la";
const COGNITO_REGION = "us-east-2";
const COGNITO_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── AES-GCM helpers ─────────────────────────────────────────────────────────

async function importKey(rawKey: string): Promise<CryptoKey> {
  const keyBytes = new TextEncoder().encode(rawKey.padEnd(32, "0").slice(0, 32));
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function encryptPassword(plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const key = await importKey(ENC_KEY);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return { ciphertext: toBase64(encrypted), iv: toBase64(iv.buffer) };
}

async function decryptPassword(ciphertext: string, iv: string): Promise<string> {
  const key = await importKey(ENC_KEY);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    key,
    fromBase64(ciphertext)
  );
  return new TextDecoder().decode(decrypted);
}

// ── Cognito auth ─────────────────────────────────────────────────────────────

async function cognitoAuth(email: string, password: string) {
  const res = await fetch(COGNITO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: { USERNAME: email, PASSWORD: password },
      ClientId: COGNITO_CLIENT_ID,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.__type || err.message || "Cognito auth failed");
  }
  const data = await res.json();
  return {
    idToken: data.AuthenticationResult.IdToken as string,
    refreshToken: data.AuthenticationResult.RefreshToken as string,
    expiresIn: data.AuthenticationResult.ExpiresIn as number,
  };
}

async function cognitoRefresh(refreshToken: string) {
  const res = await fetch(COGNITO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      AuthParameters: { REFRESH_TOKEN: refreshToken },
      ClientId: COGNITO_CLIENT_ID,
    }),
  });
  if (!res.ok) throw new Error("Token refresh failed");
  const data = await res.json();
  return {
    idToken: data.AuthenticationResult.IdToken as string,
    expiresIn: data.AuthenticationResult.ExpiresIn as number,
  };
}

// ── Get/refresh token for a seller ───────────────────────────────────────────

async function getValidToken(sellerId: string): Promise<string> {
  const { data: seller, error } = await supabase
    .from("eldorado_sellers")
    .select("*")
    .eq("id", sellerId)
    .single();

  if (error || !seller) throw new Error("Seller not found");

  // Check if cached token is still valid (with 2-minute buffer)
  if (seller.cached_token && seller.token_expires_at) {
    const expiresAt = new Date(seller.token_expires_at).getTime();
    if (expiresAt - Date.now() > 120_000) {
      return seller.cached_token;
    }
  }

  // Try refresh token first
  if (seller.refresh_token) {
    try {
      const { idToken, expiresIn } = await cognitoRefresh(seller.refresh_token);
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      await supabase
        .from("eldorado_sellers")
        .update({ cached_token: idToken, token_expires_at: expiresAt })
        .eq("id", sellerId);
      return idToken;
    } catch {
      // Fall through to full re-auth
    }
  }

  // Full re-auth with stored credentials
  if (!seller.encrypted_password || !seller.password_iv) {
    throw new Error("No credentials stored — please re-enter the password for this seller");
  }

  const password = await decryptPassword(seller.encrypted_password, seller.password_iv);
  const { idToken, refreshToken, expiresIn } = await cognitoAuth(seller.eldorado_email, password);
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  await supabase
    .from("eldorado_sellers")
    .update({ cached_token: idToken, refresh_token: refreshToken, token_expires_at: expiresAt })
    .eq("id", sellerId);

  return idToken;
}

// ── Eldorado API proxy ────────────────────────────────────────────────────────

async function callEldorado(idToken: string, method: string, endpoint: string, body?: unknown) {
  const url = `${ELDORADO_HOST}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Cookie": `__Host-EldoradoIdToken=${idToken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "swagger": "Swager request",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return { status: res.status, ok: res.ok, data: json };
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // Verify admin auth
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: auth } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });

    const { data: adminCheck } = await supabase
      .from("admin_users").select("id").eq("user_id", user.id).eq("active", true).maybeSingle();
    if (!adminCheck) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: cors });

    const { action, sellerId, endpoint, method, body, params } = await req.json();
    const json = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

    // ── Seller CRUD ──
    if (action === "get_sellers") {
      const { data, error } = await supabase
        .from("eldorado_sellers")
        .select("id, display_name, eldorado_email, token_expires_at, is_active, created_at, cached_token")
        .order("created_at");
      if (error) return json({ error: error.message }, 500);
      // Add token_status field (don't expose raw token)
      const sellers = (data || []).map(s => ({
        ...s,
        cached_token: undefined,
        has_token: !!s.cached_token,
        token_valid: s.cached_token && s.token_expires_at
          ? new Date(s.token_expires_at).getTime() > Date.now()
          : false,
      }));
      return json({ sellers });
    }

    if (action === "add_seller") {
      const { display_name, eldorado_email, password } = body;
      if (!display_name || !eldorado_email || !password) return json({ error: "Missing fields" }, 400);

      const { ciphertext, iv } = await encryptPassword(password);

      // Attempt auth immediately to verify credentials
      let idToken = "", refreshToken = "", expiresAt = "";
      try {
        const result = await cognitoAuth(eldorado_email, password);
        idToken = result.idToken;
        refreshToken = result.refreshToken;
        expiresAt = new Date(Date.now() + result.expiresIn * 1000).toISOString();
      } catch (authErr) {
        return json({ error: `Credential check failed: ${authErr instanceof Error ? authErr.message : String(authErr)}` }, 400);
      }

      const { data, error } = await supabase.from("eldorado_sellers").insert({
        display_name, eldorado_email,
        encrypted_password: ciphertext, password_iv: iv,
        cached_token: idToken, refresh_token: refreshToken, token_expires_at: expiresAt,
        is_active: true,
      }).select("id, display_name, eldorado_email, token_expires_at, is_active").single();

      if (error) return json({ error: error.message }, 500);
      return json({ seller: { ...data, has_token: true, token_valid: true } });
    }

    if (action === "delete_seller") {
      const { error } = await supabase.from("eldorado_sellers").delete().eq("id", sellerId);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (action === "refresh_token") {
      try {
        const token = await getValidToken(sellerId);
        return json({ success: true, message: "Token refreshed successfully" });
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : String(err) }, 400);
      }
    }

    if (action === "update_password") {
      const { password } = body;
      const { ciphertext, iv } = await encryptPassword(password);

      // Re-auth with new password
      const { data: seller } = await supabase.from("eldorado_sellers").select("eldorado_email").eq("id", sellerId).single();
      if (!seller) return json({ error: "Seller not found" }, 404);

      try {
        const { idToken, refreshToken, expiresIn } = await cognitoAuth(seller.eldorado_email, password);
        const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
        await supabase.from("eldorado_sellers").update({
          encrypted_password: ciphertext, password_iv: iv,
          cached_token: idToken, refresh_token: refreshToken, token_expires_at: expiresAt,
        }).eq("id", sellerId);
        return json({ success: true });
      } catch (err) {
        return json({ error: `Auth failed: ${err instanceof Error ? err.message : String(err)}` }, 400);
      }
    }

    // ── Eldorado API proxy ──
    if (action === "call_api") {
      if (!sellerId || !endpoint || !method) return json({ error: "Missing sellerId/endpoint/method" }, 400);

      const idToken = await getValidToken(sellerId);
      let finalEndpoint = endpoint;
      if (params && Object.keys(params).length > 0) {
        const qs = new URLSearchParams(params).toString();
        finalEndpoint = `${endpoint}?${qs}`;
      }

      const result = await callEldorado(idToken, method, finalEndpoint, body);
      return json(result.data, result.status);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("eldorado-api error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Server error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
