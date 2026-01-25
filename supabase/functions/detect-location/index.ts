import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Get client IP from request headers
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   req.headers.get('cf-connecting-ip') ||
                   req.headers.get('x-real-ip') ||
                   'unknown'

  try {
    // Call ipapi.co from backend (bypasses CORS and has better rate limits)
    const response = await fetch(`https://ipapi.co/${clientIp}/json/`, {
      headers: {
        'User-Agent': 'Zeus Services'
      }
    })

    if (!response.ok) {
      throw new Error(`ipapi.co returned ${response.status}`)
    }

    const data = await response.json()

    const countryToCurrency: Record<string, string> = {
      'US': 'USD',
      'GB': 'GBP',
      'IE': 'EUR',
      'DE': 'EUR',
      'FR': 'EUR',
      'ES': 'EUR',
      'IT': 'EUR',
      'NL': 'EUR',
      'BE': 'EUR',
      'AT': 'EUR',
      'GR': 'EUR',
      'PT': 'EUR',
      'CY': 'EUR',
      'LU': 'EUR',
      'MT': 'EUR',
      'SK': 'EUR',
      'SI': 'EUR',
      'LT': 'EUR',
      'LV': 'EUR',
      'EE': 'EUR',
      'FI': 'EUR'
    }

    const currency = countryToCurrency[data.country_code] || 'GBP'

    return new Response(
      JSON.stringify({
        country_code: data.country_code,
        currency: currency,
        ip: data.ip,
        city: data.city,
        region: data.region
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  } catch (error) {
    console.error('Location detection error:', error)
    
    // Return default GBP on error
    return new Response(
      JSON.stringify({
        country_code: 'GB',
        currency: 'GBP',
        error: true
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
