/**
 * Ping Google and Bing when sitemap changes
 * Call this after adding/updating products or services
 */

import { supabase } from '../supabaseClient'

export async function pingSitemap() {
  try {
    // Call the edge function to ping search engines
    const { data, error } = await supabase.functions.invoke('ping-sitemap')
    
    if (error) {
      console.error('Error pinging sitemap:', error)
      return false
    }
    
    console.log('Sitemap ping successful:', data)
    return true
  } catch (error) {
    console.error('Failed to ping sitemap:', error)
    return false
  }
}

/**
 * Alternative: Direct ping from client (simpler but less reliable)
 */
export async function pingSitemapDirect() {
  const sitemapUrl = 'https://zeuservices.com/sitemap.xml'
  
  try {
    // Ping Google
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    await fetch(googlePingUrl, { mode: 'no-cors' })
    
    // Ping Bing
    const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    await fetch(bingPingUrl, { mode: 'no-cors' })
    
    console.log('Search engines notified of sitemap update')
    return true
  } catch (error) {
    console.error('Error pinging search engines:', error)
    return false
  }
}
