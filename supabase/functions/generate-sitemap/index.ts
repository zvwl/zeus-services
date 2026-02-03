// Deno Edge Function to generate dynamic sitemap
// Deploy this and use it as your sitemap source

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const baseUrl = 'https://zeuservices.com'
    const now = new Date().toISOString().split('T')[0]

    // Static pages
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily', lastmod: now },
      { url: '/services', priority: '0.95', changefreq: 'daily', lastmod: now },
      { url: '/products', priority: '0.95', changefreq: 'daily', lastmod: now },
      { url: '/reviews', priority: '0.85', changefreq: 'weekly', lastmod: now },
      { url: '/cart', priority: '0.7', changefreq: 'monthly', lastmod: now },
      { url: '/orders', priority: '0.6', changefreq: 'monthly', lastmod: now },
      { url: '/terms', priority: '0.4', changefreq: 'monthly', lastmod: now },
      { url: '/privacy', priority: '0.4', changefreq: 'monthly', lastmod: now },
      { url: '/refund', priority: '0.4', changefreq: 'monthly', lastmod: now },
      { url: '/login', priority: '0.3', changefreq: 'yearly', lastmod: now },
      { url: '/signup', priority: '0.3', changefreq: 'yearly', lastmod: now },
    ]

    // Fetch active products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, updated_at')
      .eq('active', true)

    // Fetch active services
    const { data: services } = await supabase
      .from('services')
      .select('id, name, updated_at')
      .eq('active', true)

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`

    // Add static pages
    for (const page of staticPages) {
      xml += `  
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`
    }

    // Add dynamic product pages (if you have individual product pages)
    if (products) {
      for (const product of products) {
        const lastmod = product.updated_at?.split('T')[0] || now
        xml += `  
  <url>
    <loc>${baseUrl}/products/${product.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`
      }
    }

    // Add dynamic service pages (if you have individual service pages)
    if (services) {
      for (const service of services) {
        const lastmod = service.updated_at?.split('T')[0] || now
        xml += `  
  <url>
    <loc>${baseUrl}/services/${service.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`
      }
    }

    xml += `
</urlset>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
})
