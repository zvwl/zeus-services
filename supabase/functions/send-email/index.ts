import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface AuthHookEvent {
  user: {
    id: string
    email: string
    user_metadata?: {
      name?: string
    }
  }
  event: string
  invocation_id: string
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = (await req.json()) as AuthHookEvent
    console.log('Auth Hook Event:', JSON.stringify(body, null, 2))

    const { user, event } = body

    if (!user || !user.email) {
      return new Response(
        JSON.stringify({ error: 'Missing user or user email' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Only handle signup events
    if (event !== 'validate_signup') {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!RESEND_API_KEY) {
      console.error('ERROR: RESEND_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const userName = user.user_metadata?.name || user.email.split('@')[0]

    console.log('Sending welcome email to:', user.email)

    // Call Resend API with template
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Zeus Services <no-reply@zeuservices.com>',
        to: user.email,
        template: {
          id: 'confirmation-email',
          variables: {
            name: userName
          }
        }
      })
    })

    const resendData = await resendRes.json()
    console.log('Resend API response:', JSON.stringify(resendData, null, 2))

    if (!resendRes.ok) {
      console.error('Resend error:', resendData)
      return new Response(JSON.stringify({ error: resendData }), {
        status: resendRes.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Auth Hook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
