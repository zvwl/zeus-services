import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface EmailRequest {
  to: string
  template_id: string
  variables: Record<string, string>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Received request body:', JSON.stringify(body, null, 2))
    
    const { to, template_id, variables } = body as EmailRequest

    if (!to || !template_id || !variables) {
      console.log('Missing fields check - to:', to, 'template_id:', template_id, 'variables:', variables)
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, template_id, variables' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!RESEND_API_KEY) {
      console.log('ERROR: RESEND_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Calling Resend API with template:', template_id)
    
    // Call Resend API with template
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Zeus Services <no-reply@zeuservices.com>',
        to,
        template: {
          id: template_id,
          variables
        }
      })
    })

    const resendData = await resendRes.json()
    console.log('Resend API response:', JSON.stringify(resendData, null, 2))

    if (!resendRes.ok) {
      return new Response(JSON.stringify({ error: resendData }), {
        status: resendRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
