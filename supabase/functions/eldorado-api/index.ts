import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ENC_KEY = Deno.env.get("NOTES_ENC_KEY") ?? "";

const ELDORADO_HOST = "https://www.eldorado.gg";
const COGNITO_CLIENT_ID = "1956req5ro9drdtbf5i6kis4la";
const COGNITO_REGION = "us-east-2";
const COGNITO_POOL_NAME = "MlnzCFgHk"; // from us-east-2_MlnzCFgHk
const COGNITO_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── AES-GCM helpers ───────────────────────────────────────────────────────────

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

// ── Cognito SRP Auth ──────────────────────────────────────────────────────────
// Implements USER_SRP_AUTH + PASSWORD_VERIFIER challenge (Amplify-compatible)

const N_HEX =
  "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1" +
  "29024E088A67CC74020BBEA63B139B22514A08798E3404DD" +
  "EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245" +
  "E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED" +
  "EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D" +
  "C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F" +
  "83655D23DCA3AD961C62F356208552BB9ED529077096966D" +
  "670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B" +
  "E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9" +
  "DE2BCBF6955817183995497CEA956AE515D2261898FA0510" +
  "15728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64" +
  "ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7" +
  "ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6B" +
  "F12FFA06D98A0864D87602733EC86A64521F2B18177B200C" +
  "BBE117577A615D6C770988C0BAD946E208E24FA074E5AB31" +
  "43DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF";

const G_HEX = "2";

function hexToBigInt(hex: string): bigint {
  return BigInt("0x" + hex);
}

function bigIntToHex(n: bigint): string {
  let hex = n.toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;
  return hex;
}

// Pad hex so the leading byte has its high bit clear (avoids negative interpretation)
function padHex(hex: string): string {
  if (hex.length % 2 !== 0) hex = "0" + hex;
  if (parseInt(hex.substring(0, 2), 16) >= 128) hex = "00" + hex;
  return hex;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  if (mod === 1n) return 0n;
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

async function sha256hex(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSHA256(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
}

// HKDF as used by amazon-cognito-identity-js
async function cognitoHkdf(ikm: Uint8Array, salt: Uint8Array): Promise<Uint8Array> {
  const prk = await hmacSHA256(salt, ikm);
  const info = new Uint8Array([...new TextEncoder().encode("Caltech"), 1]);
  const okm = await hmacSHA256(prk, info);
  return okm.slice(0, 16);
}

// Cognito timestamp: "Wed May 22 21:07:22 UTC 2026"
function cognitoTimestamp(): string {
  const now = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[now.getUTCDay()]} ${months[now.getUTCMonth()]} ${now.getUTCDate()} ${now.toISOString().slice(11, 19)} UTC ${now.getUTCFullYear()}`;
}

async function cognitoSRPAuth(email: string, password: string): Promise<{
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const N = hexToBigInt(N_HEX);
  const g = hexToBigInt(G_HEX);

  // k = H(pad(N) || pad(g))
  const k = hexToBigInt(await sha256hex(hexToBytes(padHex(N_HEX) + padHex(G_HEX))));

  // Random 256-bit a, compute A = g^a mod N
  const aBytes = crypto.getRandomValues(new Uint8Array(32));
  const a = hexToBigInt(Array.from(aBytes).map(b => b.toString(16).padStart(2, "0")).join("")) % N;
  const A = modPow(g, a, N);
  const AHex = padHex(bigIntToHex(A));

  // Step 1: Initiate SRP auth
  const initRes = await fetch(COGNITO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "USER_SRP_AUTH",
      AuthParameters: { USERNAME: email, SRP_A: AHex },
      ClientId: COGNITO_CLIENT_ID,
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.__type || err.message || "SRP init failed");
  }

  const initData = await initRes.json();
  if (initData.ChallengeName !== "PASSWORD_VERIFIER") {
    throw new Error(`Unexpected Cognito challenge: ${initData.ChallengeName}`);
  }

  const { SRP_B, SALT, SECRET_BLOCK, USER_ID_FOR_SRP } = initData.ChallengeParameters;
  const B = hexToBigInt(SRP_B);

  // u = H(pad(A) || pad(B))
  const uHex = await sha256hex(hexToBytes(padHex(AHex) + padHex(SRP_B)));
  const u = hexToBigInt(uHex);

  // x = H(bytes(pad(SALT)) || sha256(poolName + USER_ID_FOR_SRP + ":" + password))
  const userpassHashHex = await sha256hex(new TextEncoder().encode(`${COGNITO_POOL_NAME}${USER_ID_FOR_SRP}:${password}`));
  const xHex = await sha256hex(hexToBytes(padHex(SALT) + userpassHashHex));
  const x = hexToBigInt(xHex);

  // S = ((B - k*g^x) mod N) ^ (u*x + a) mod N
  const gx = modPow(g, x, N);
  const kgx = (k * gx) % N;
  const base = ((B - kgx) % N + N) % N;
  const S = modPow(base, u * x + a, N);
  const SHex = padHex(bigIntToHex(S));

  // Derive 16-byte auth key: HKDF(ikm=pad(S), salt=pad(u))
  const hkdfKey = await cognitoHkdf(hexToBytes(SHex), hexToBytes(padHex(uHex)));

  // Build and sign the challenge message
  const timestamp = cognitoTimestamp();
  const enc = new TextEncoder();
  const secretBlockBytes = Uint8Array.from(atob(SECRET_BLOCK), c => c.charCodeAt(0));
  const parts = [enc.encode(COGNITO_POOL_NAME), enc.encode(USER_ID_FOR_SRP), secretBlockBytes, enc.encode(timestamp)];
  const msg = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let off = 0;
  for (const p of parts) { msg.set(p, off); off += p.length; }

  const signature = btoa(String.fromCharCode(...await hmacSHA256(hkdfKey, msg)));

  // Step 2: Respond to PASSWORD_VERIFIER
  const challengeRes = await fetch(COGNITO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.RespondToAuthChallenge",
    },
    body: JSON.stringify({
      ChallengeName: "PASSWORD_VERIFIER",
      ChallengeResponses: {
        USERNAME: USER_ID_FOR_SRP,
        PASSWORD_CLAIM_SECRET_BLOCK: SECRET_BLOCK,
        TIMESTAMP: timestamp,
        PASSWORD_CLAIM_SIGNATURE: signature,
      },
      ClientId: COGNITO_CLIENT_ID,
    }),
  });

  if (!challengeRes.ok) {
    const err = await challengeRes.json().catch(() => ({}));
    throw new Error(err.__type || err.message || "SRP challenge failed");
  }

  const result = (await challengeRes.json()).AuthenticationResult;
  return {
    idToken: result.IdToken as string,
    refreshToken: result.RefreshToken as string,
    expiresIn: result.ExpiresIn as number,
  };
}

// ── Token refresh (unchanged — refresh tokens don't use SRP) ──────────────────

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

  if (seller.cached_token && seller.token_expires_at) {
    const expiresAt = new Date(seller.token_expires_at).getTime();
    if (expiresAt - Date.now() > 120_000) return seller.cached_token;
  }

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

  if (!seller.encrypted_password || !seller.password_iv) {
    throw new Error("No credentials stored — please re-enter the password for this seller");
  }

  const password = await decryptPassword(seller.encrypted_password, seller.password_iv);
  const { idToken, refreshToken, expiresIn } = await cognitoSRPAuth(seller.eldorado_email, password);
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

    if (action === "get_sellers") {
      const { data, error } = await supabase
        .from("eldorado_sellers")
        .select("id, display_name, eldorado_email, token_expires_at, is_active, created_at, cached_token")
        .order("created_at");
      if (error) return json({ error: error.message }, 500);
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

      let idToken = "", refreshToken = "", expiresAt = "";
      try {
        const result = await cognitoSRPAuth(eldorado_email, password);
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
        await getValidToken(sellerId);
        return json({ success: true, message: "Token refreshed successfully" });
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : String(err) }, 400);
      }
    }

    if (action === "update_password") {
      const { password } = body;
      const { ciphertext, iv } = await encryptPassword(password);

      const { data: seller } = await supabase.from("eldorado_sellers").select("eldorado_email").eq("id", sellerId).single();
      if (!seller) return json({ error: "Seller not found" }, 404);

      try {
        const { idToken, refreshToken, expiresIn } = await cognitoSRPAuth(seller.eldorado_email, password);
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
