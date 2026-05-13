import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const NOTES_ENC_KEY = Deno.env.get("NOTES_ENC_KEY") ?? "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function importAesKey(base64Key: string) {
  const raw = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);
}

async function decryptNote(ciphertext: string, iv: string): Promise<string> {
  const key = await importAesKey(NOTES_ENC_KEY);
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  const cipherBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes }, key, cipherBytes);
  return new TextDecoder().decode(decrypted);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const paymentIntentId = url.searchParams.get("payment_intent_id");

  if (!paymentIntentId) {
    return new Response(JSON.stringify({ error: "payment_intent_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Authenticate the caller so we only return orders belonging to them
  const authHeader = req.headers.get("Authorization") ?? "";
  let callerId: string | null = null;

  if (authHeader && SUPABASE_ANON_KEY) {
    try {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) callerId = user.id;
    } catch { /* ignore */ }
  }

  try {
    let query = supabaseAdmin
      .from("orders")
      .select("id, status, payment_status, items, total_amount, currency, created_at, customer_email, notes_ciphertext, notes_iv")
      .eq("payment_intent_id", paymentIntentId);

    // Scope to the authenticated user if we have one
    if (callerId) query = query.eq("user_id", callerId);

    const { data: order, error } = await query.maybeSingle();

    if (error) throw error;
    if (!order) {
      return new Response(JSON.stringify({ order: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decrypt notes if present
    let notePlaintext: string | null = null;
    if (order.notes_ciphertext && order.notes_iv && NOTES_ENC_KEY) {
      try {
        notePlaintext = await decryptNote(order.notes_ciphertext, order.notes_iv);
      } catch { /* ignore decrypt failures */ }
    }

    return new Response(
      JSON.stringify({ order: { ...order, note_plaintext: notePlaintext } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-order-by-payment-intent error:", err);
    return new Response(JSON.stringify({ error: err?.message ?? "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
