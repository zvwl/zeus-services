import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const NOTES_ENC_KEY = Deno.env.get("NOTES_ENC_KEY");

const supabaseUser = createClient(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "");
const supabaseService = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: { autoRefreshToken: false, persistSession: false }
});

const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://zeuservices.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": FRONTEND_URL,
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Access-Control-Allow-Methods": "GET,OPTIONS"
};

async function importAesKey(base64Key: string) {
  const raw = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);
}

function fromBase64(b64: string) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function decryptNote(ciphertext: string | null, iv: string | null) {
  if (!ciphertext || !iv || !NOTES_ENC_KEY) return null;
  const key = await importAesKey(NOTES_ENC_KEY);
  const ct = fromBase64(ciphertext);
  const ivBytes = fromBase64(iv);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, key, ct);
  return new TextDecoder().decode(decrypted);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");
    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) return new Response(JSON.stringify({ error: "Missing auth token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Verify user session
    const { data: userData, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const user = userData.user;

    const { data: order, error } = await supabaseService
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!order) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const note = await decryptNote(order.notes_ciphertext, order.notes_iv) || order.notes || null;

    return new Response(JSON.stringify({ order: { ...order, note_plaintext: note } }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("get-user-order error", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
