import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://zeuservices.com";

const supabaseUser = createClient(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "");
const supabaseService = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: { autoRefreshToken: false, persistSession: false }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": FRONTEND_URL,
  "Access-Control-Allow-Headers": "authorization,apikey,content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: userData, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: adminRow } = await supabaseService
      .from("admin_users")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: linkData, error: linkError } = await supabaseService.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Generate link error:", linkError);
      return new Response(JSON.stringify({ error: linkError?.message || "Failed to generate link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const magicLink = linkData.properties.action_link;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Zeus Services <support@zeuservices.com>",
        to: email,
        subject: "Your Zeuservices Login Link",
        html: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 20px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 26px; letter-spacing: 0.5px;">Zeus Services</h1>
    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Secure Login Link</p>
  </div>
  <div style="padding: 32px 20px; max-width: 640px; margin: 0 auto; background: #f8fafc;">
    <p style="font-size: 16px; margin: 0 0 12px;">Hi,</p>
    <p style="font-size: 15px; color: #555; margin: 0 0 20px;">Our support team has sent you a secure one-click login link. No password needed.</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${magicLink}" style="display: inline-block; background-color: #FFD700; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Login to My Account</a>
    </div>
    <p style="font-size: 13px; color: #999; text-align: center; margin: 0;">This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>
    <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #999; margin-top: 24px;">
      <p style="margin: 4px 0;">© 2026 Zeus Services. All rights reserved.</p>
      <p style="margin: 4px 0;"><a href="https://zeuservices.com" style="color: #0066cc; text-decoration: none;">Visit Our Website</a></p>
    </div>
  </div>
</div>`
      })
    });

    if (!resendRes.ok) {
      const body = await resendRes.json().catch(() => ({}));
      console.error("Resend error:", body);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Send magic link error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
