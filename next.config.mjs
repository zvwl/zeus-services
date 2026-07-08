/** @type {import('next').NextConfig} */

// Content-Security-Policy allowlisting only the third parties this app talks to:
// Supabase (auth/data/storage), Stripe, Cloudflare Turnstile, Google Analytics,
// and Vercel Analytics/Speed-Insights (served same-origin). 'unsafe-inline' /
// 'unsafe-eval' are required by the Next.js runtime + these vendors' snippets.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  // Inter is self-hosted via next/font (app/layout.tsx), so fonts are served
  // same-origin from /_next/static — no Google Fonts hosts needed.
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://widget.trustpilot.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://api.stripe.com https://widget.trustpilot.com",
  "frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com https://hooks.stripe.com https://widget.trustpilot.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Don't advertise the framework.
  poweredByHeader: false,
  images: {
    // Only hosts we actually render from: Supabase storage (product/site
    // images) and OAuth avatar CDNs (Discord / Google profile pictures).
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    // Uploads get a UUID path per file (api/upload), so a URL's content never
    // changes — cache optimized variants for a year instead of re-optimizing
    // hourly (cold optimizer responses were showing up in the LCP tail).
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // Product slug was tidied for SEO; keep the old URL from 404-ing.
      {
        source: "/product/v-bucks-top-up",
        destination: "/product/fortnite-v-bucks",
        permanent: true,
      },
      // Legacy-site URL families still hit by bots/old links. Redirecting at
      // the edge spares a full dynamic-shell 404 render per hit.
      {
        source: "/accounts.gta5/:path*",
        destination: "/games",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
