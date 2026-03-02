// Deno Edge Function to notify search engines about sitemap changes
// Trigger this whenever you add/update categories, games, or items

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const sitemapUrl = 'https://zeuservices.com/sitemap.xml'

    // Ping Bing (supported endpoint)
    const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    const bingResponse = await fetch(bingPingUrl)

    console.log('Bing ping status:', bingResponse.status)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sitemap ping sent',
        bing: bingResponse.status,
        google: 'Use Google Search Console sitemap submission and URL inspection for fastest refresh'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error pinging sitemap:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
