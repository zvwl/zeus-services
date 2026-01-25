import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7?deno-std=0.224.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET");

const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_SERVICE_ROLE_KEY ?? "");

Deno.serve(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const event = await req.json();
    
    console.log('Received email event:', JSON.stringify(event, null, 2));

    // Verify webhook signature if secret is configured
    if (RESEND_WEBHOOK_SECRET) {
      const signature = req.headers.get('svix-signature');
      const id = req.headers.get('svix-id');
      const timestamp = req.headers.get('svix-timestamp');
      
      console.log('Webhook headers:', { signature, id, timestamp });
      // TODO: Implement proper Svix signature verification if needed
    }

    // Handle email.received event
    if (event.type === 'email.received') {
      const { email_id, from, to, subject, created_at } = event.data;
      
      console.log('Email received:', {
        email_id,
        from,
        to,
        subject,
        created_at
      });

      // TODO: Add your custom logic here:
      // - Store in database
      // - Forward to support team
      // - Auto-reply
      // - Extract attachments via Resend API
      
      // Example: Store in a received_emails table
      // const { error: insertError } = await supabase
      //   .from('received_emails')
      //   .insert({
      //     email_id,
      //     from_address: from,
      //     to_address: to,
      //     subject,
      //     received_at: created_at
      //   });
      
      // if (insertError) {
      //   console.error('Failed to store email:', insertError);
      // }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle other event types
    console.log('Unhandled event type:', event.type);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Receive email error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
