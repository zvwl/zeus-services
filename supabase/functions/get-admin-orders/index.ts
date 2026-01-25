import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const NOTES_ENC_KEY = Deno.env.get("NOTES_ENC_KEY");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars");
}

const supabaseUser = createClient(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "");
const supabaseService = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: { autoRefreshToken: false, persistSession: false }
});

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
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") ?? "all";
    const search = (url.searchParams.get("q") ?? "").trim();

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) return new Response(JSON.stringify({ error: "Missing auth token" }), { status: 401, headers: { "Content-Type": "application/json" } });

    // Verify user session
    const { data: userData, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    const user = userData.user;

    // Admin check
    const { data: adminRow } = await supabaseService
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
    }

    // Build query
    let query = supabaseService
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    // Simple search by id/user/email
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (search) {
      if (uuidRegex.test(search)) {
        query = query.or(`id.eq.${search},user_id.eq.${search},customer_email.ilike.%${search}%`);
      } else if (search.includes("@")) {
        query = query.or(`customer_email.ilike.%${search}%`);
      } else {
        // non-email: allow partial match client side
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    let results = data || [];
    if (search && !uuidRegex.test(search)) {
      const qLower = search.toLowerCase();
      results = results.filter(o =>
        String(o.id || "").toLowerCase().includes(qLower) ||
        String(o.customer_email || "").toLowerCase().includes(qLower)
      );
    }

    const withNotes = await Promise.all(results.map(async (order) => {
      const note = await decryptNote(order.notes_ciphertext, order.notes_iv) || order.notes || null;
      return { ...order, note_plaintext: note };
    }));

    return new Response(JSON.stringify({ orders: withNotes }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("get-admin-orders error", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
