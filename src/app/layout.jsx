import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import HeaderClient from '@/components/Header'
import FooterClient from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import CookieBanner from '@/components/CookieBanner'
import ToastRenderer from '@/components/ToastRenderer'
import StatusBanner from '@/components/StatusBanner'
import '@/index.css'
import '@/App.css'

export const metadata = {
  metadataBase: new URL('https://zeuservices.com'),
  title: {
    default: 'Zeuservices - Multi-Game Topups, Boosting & Accounts',
    template: '%s | Zeuservices',
  },
  description:
    'Professional gaming services for GTA 5, Fortnite, Rocket League, and Forza Horizon 6. Account boosting, modded accounts, and topups with safe manual delivery. 9+ years trusted.',
  keywords: 'game boosting, account services, topups, modded accounts, GTA 5, Fortnite, Rocket League',
  authors: [{ name: 'Zeuservices' }],
  creator: 'Zeuservices',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://zeuservices.com',
    siteName: 'Zeuservices',
    title: 'Zeuservices - Multi-Game Topups, Boosting & Accounts',
    description:
      'Professional gaming services for GTA 5, Fortnite, Rocket League, and Forza Horizon 6. Safe, manual delivery. 9+ years trusted.',
    images: [{ url: '/zeus-logo-main.webp', width: 512, height: 512, alt: 'Zeuservices' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zeuservices - Multi-Game Topups, Boosting & Accounts',
    description: 'Professional gaming services with safe manual delivery. 9+ years trusted.',
    images: ['/zeus-logo-main.webp'],
  },
  robots: { index: true, follow: true },
  verification: { google: 'vpn1AG73aR7pQSZWGcSssbcwJwM--yQHM4LV0uHh5xU' },
  icons: {
    icon: [
      { url: '/zeus-logo-main-32.webp', sizes: '32x32' },
      { url: '/zeus-logo-main-96.webp', sizes: '96x96' },
      { url: '/zeus-logo-main-192.webp', sizes: '192x192' },
    ],
    apple: [{ url: '/zeus-logo-main-180.webp', sizes: '180x180' }],
  },
}

// Global JSON-LD schemas that apply to every page
const globalSchemas = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Zeuservices',
    url: 'https://zeuservices.com',
    description: 'Professional multi-game topups, boosting, and account services.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Zeuservices',
    url: 'https://zeuservices.com',
    logo: { '@type': 'ImageObject', url: 'https://zeuservices.com/zeus-logo-main.webp', width: 512, height: 512 },
    image: 'https://zeuservices.com/zeus-logo-main.webp',
    description: 'Professional multi-game top-ups, boosting, and account services with safe manual delivery via Discord. 9+ years of trusted experience.',
    sameAs: ['https://www.zeuservices.com'],
    contactPoint: { '@type': 'ContactPoint', contactType: 'Customer Service', availableLanguage: ['English'] },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      bestRating: '5',
      worstRating: '1',
      ratingCount: '20',
      reviewCount: '20',
    },
  },
]

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0e1a" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
        {/* GTM consent-aware loader */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              let cv = 'denied';
              try { cv = localStorage.getItem('cookieConsent') === 'accepted' ? 'granted' : 'denied'; } catch(_){}
              gtag('consent','default',{analytics_storage:cv,ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
              const loadGTM = () => {
                if(window.__gtmLoaded) return;
                window.__gtmLoaded = true;
                window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});
                const s = document.createElement('script');
                s.async = true;
                s.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-5BRVX8DR';
                document.head.appendChild(s);
              };
              if('requestIdleCallback' in window) requestIdleCallback(loadGTM,{timeout:3000});
              else window.addEventListener('load',loadGTM);
            `,
          }}
        />
        {globalSchemas.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5BRVX8DR"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <AuthProvider>
          <CartProvider>
            <div className="app">
              <div className="top-stack">
                <StatusBanner />
                <HeaderClient />
              </div>
              <CartDrawer />
              <main className="main-content">{children}</main>
              <FooterClient />
              <CookieBanner />
              <ToastRenderer />
            </div>
          </CartProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
