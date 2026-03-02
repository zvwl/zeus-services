/**
 * Notify search engines when sitemap changes
 * Call this after adding/updating categories, games, or items
 */

import { supabase } from '../supabaseClient'

export async function pingSitemap() {
  try {
    const functionNames = ['ping-sitemap', 'deploy-ping-sitemap']

    for (const functionName of functionNames) {
      const { data, error } = await supabase.functions.invoke(functionName)

      if (!error) {
        console.log(`Sitemap ping successful via ${functionName}:`, data)
        return true
      }

      const status = error?.context?.status
      if (status && status !== 404) {
        console.error(`Error pinging sitemap via ${functionName}:`, error)
        return false
      }
    }

    console.error('Sitemap ping function not found (tried ping-sitemap and deploy-ping-sitemap)')
    return false
  } catch (error) {
    console.error('Failed to ping sitemap:', error)
    return false
  }
}

/**
 * Alternative: Direct ping from client (Bing only)
 * Google no longer reliably supports unauthenticated sitemap ping endpoints.
 */
export async function pingSitemapDirect() {
  const sitemapUrl = 'https://zeuservices.com/sitemap.xml'
  
  try {
    // Ping Bing
    const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    await fetch(bingPingUrl, { mode: 'no-cors' })
    
    console.log('Bing notified of sitemap update')
    return true
  } catch (error) {
    console.error('Error pinging sitemap:', error)
    return false
  }
}
