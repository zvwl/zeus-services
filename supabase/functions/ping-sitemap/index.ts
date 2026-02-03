// Deno Edge Function to ping Google about sitemap changes
// Trigger this whenever you add/update products or services

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const sitemapUrl = 'https://zeuservices.com/sitemap.xml'
    
    // Ping Google
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    const googleResponse = await fetch(googlePingUrl)
    
    // Ping Bing (optional)
    const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    const bingResponse = await fetch(bingPingUrl)

    console.log('Google ping status:', googleResponse.status)
    console.log('Bing ping status:', bingResponse.status)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sitemap ping sent successfully',
        google: googleResponse.status,
        bing: bingResponse.status
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error pinging sitemap:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
