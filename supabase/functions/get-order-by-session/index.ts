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
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing session_id parameter" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`Fetching order for checkout session: ${sessionId}`);

    // Use service role to bypass RLS and find order by session ID
    // This works regardless of whether the order has a user_id or not
    const { data, error } = await supabaseService
      .from("orders")
      .select("*")
      .eq("checkout_session_id", sessionId)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching order: ${error.message}`);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    if (!data) {
      console.log(`No order found for session ${sessionId}`);
      return new Response(JSON.stringify({ order: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`✅ Found order ${data.id} for session ${sessionId}`);

    // Decrypt notes if needed
    const note = await decryptNote(data.notes_ciphertext, data.notes_iv) || data.notes || null;

    return new Response(JSON.stringify({ order: { ...data, note_plaintext: note } }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error(`Error in get-order-by-session: ${err.message || err}`);
    return new Response(JSON.stringify({ error: "Server error" }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
